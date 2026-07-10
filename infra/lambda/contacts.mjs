import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  BatchGetCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { json } from './util.mjs';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const ATTENDEES_TABLE = process.env.ATTENDEES_TABLE;

/**
 * GET /contacts  (Cognito-authorised)
 *
 * Returns a role-based slice of the attendee roster. The caller's identity and
 * role come from the verified Cognito token claims injected by the API Gateway
 * authorizer — never from the request body — so a member cannot ask for more
 * than their own leaders' numbers.
 *
 *   member      → { role, people: [their group leaders] }
 *   leader      → { role, people: [their group members] }
 *   maintainer  → { role, groups: [every group], maintainers: [maintainer roster] }
 */
export async function handler(event) {
  const claims = event.requestContext?.authorizer?.claims;
  if (!claims) return json(401, { message: 'Unauthorized' });

  const me = {
    id: claims['cognito:username'] || claims.sub,
    teamCode: claims['custom:team_code'] || '',
    isLeader: claims['custom:is_leader'] === 'true',
    isMaintainer: claims['custom:is_maintainer'] === 'true',
    leadersId: parseList(claims['custom:leaders_id']),
  };

  try {
    if (me.isMaintainer) return json(200, await maintainerView());
    if (me.isLeader) return json(200, await leaderView(me));
    return json(200, await memberView(me));
  } catch (err) {
    console.error(err);
    return json(500, { message: 'Server error' });
  }
}

/** Maps a raw DynamoDB attendee item to the public person shape (no email). */
function toPerson(item) {
  return {
    id: item.id,
    name: item.name || '',
    phone: item.phone || '',
    roomNumber: item.room_number || undefined,
    isLeader: item.is_leader === true,
    isMaintainer: item.is_maintainer === true,
  };
}

function byName(a, b) {
  return (a.name || '').localeCompare(b.name || '');
}

/** Parses a JSON-array string (or ;/,-separated fallback) into an id array. */
function parseList(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr.map(String);
  } catch {
    // fall through to delimiter split
  }
  return raw.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
}

/** Members see the phone numbers of their listed group leaders. */
async function memberView(me) {
  if (me.leadersId.length === 0) return { role: 'member', people: [] };
  const res = await ddb.send(
    new BatchGetCommand({
      RequestItems: {
        [ATTENDEES_TABLE]: { Keys: me.leadersId.map((id) => ({ id })) },
      },
    }),
  );
  const people = (res.Responses?.[ATTENDEES_TABLE] || []).map(toPerson).sort(byName);
  return { role: 'member', people };
}

/** Leaders see every member of their own group (excluding themselves). */
async function leaderView(me) {
  const items = await queryTeam(me.teamCode);
  const people = items
    .filter((item) => item.id !== me.id)
    .map(toPerson)
    .sort(byName);
  return { role: 'leader', people };
}

/** Maintainers see every group plus the maintainer roster. */
async function maintainerView() {
  const items = await scanAll();

  const groups = new Map();
  for (const item of items) {
    const code = item.team_code || '—';
    if (!groups.has(code)) {
      groups.set(code, { teamCode: code, teamName: item.team_name || code, members: [] });
    }
    groups.get(code).members.push(toPerson(item));
  }

  const groupList = [...groups.values()]
    .map((g) => ({ ...g, members: g.members.sort(byName) }))
    .sort((a, b) => a.teamName.localeCompare(b.teamName));

  const maintainers = items
    .filter((item) => item.is_maintainer === true)
    .map((item) => ({
      ...toPerson(item),
      teamCode: item.team_code || undefined,
      teamName: item.team_name || undefined,
    }))
    .sort(byName);

  return { role: 'maintainer', groups: groupList, maintainers };
}

/** Query the byTeam GSI for every attendee in a team_code. */
async function queryTeam(teamCode) {
  if (!teamCode) return [];
  const items = [];
  let ExclusiveStartKey;
  do {
    const res = await ddb.send(
      new QueryCommand({
        TableName: ATTENDEES_TABLE,
        IndexName: 'byTeam',
        KeyConditionExpression: 'team_code = :tc',
        ExpressionAttributeValues: { ':tc': teamCode },
        ExclusiveStartKey,
      }),
    );
    items.push(...(res.Items || []));
    ExclusiveStartKey = res.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
}

/** Full-table scan (roster is ~400-500 items — well within a single Lambda). */
async function scanAll() {
  const items = [];
  let ExclusiveStartKey;
  do {
    const res = await ddb.send(
      new ScanCommand({ TableName: ATTENDEES_TABLE, ExclusiveStartKey }),
    );
    items.push(...(res.Items || []));
    ExclusiveStartKey = res.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
}
