import os
import boto3
from botocore.exceptions import ClientError
from util import json_response

ddb = boto3.resource('dynamodb')
PARTICIPANTS_TABLE = os.environ.get('ATTENDEES_TABLE', '')

ROLE_MEMBER = 0
ROLE_LEADER = 1
ROLE_MAINTAINER = 8

UNASSIGNED = {'unassigned', 'team_0', 'room_0'}

def lambda_handler(event, context):
    query_params = event.get('queryStringParameters') or {}
    user_id = (query_params.get('id') or '').strip()
    
    if not user_id:
        return json_response(400, {'message': 'Missing id'})

    table = ddb.Table(PARTICIPANTS_TABLE)
    
    try:
        res = table.get_item(Key={'id': user_id})
        p = res.get('Item')
        if not p:
            return json_response(404, {'message': 'Unknown id'})

        return json_response(200, {'profile': to_profile(p)})
    except ClientError as err:
        print(err)
        return json_response(500, {'message': 'Server error'})
    except Exception as err:
        print(err)
        return json_response(500, {'message': 'Server error'})

def has_real_team(p):
    team_id = p.get('team_id')
    return bool(team_id) and team_id not in UNASSIGNED

def has_real_room(p):
    room_id = p.get('room_id')
    return bool(room_id) and room_id not in UNASSIGNED

def label(id_str):
    if not id_str:
        return ''
    parts = id_str.split('_')
    prefix = parts[0]
    rest = parts[1:]
    suffix = '_'.join(rest)
    if not suffix:
        return id_str
    return f"{prefix.capitalize()} {suffix}"

def to_profile(p):
    role = p.get('role', 0)
    try:
        role = int(role)
    except (ValueError, TypeError):
        role = 0
    
    phone = p.get('phone')
    phone_str = str(phone) if phone is not None and phone != 0 and phone != "0" and phone != "" else ""
    
    team_code = p.get('team_id') if has_real_team(p) else ""
    team_name = label(p.get('team_id')) if has_real_team(p) else ""
    room_number = label(p.get('room_id')) if has_real_room(p) else ""
    
    return {
        'id': p.get('id'),
        'name': p.get('name', ''),
        'email': p.get('email', ''),
        'phone': phone_str,
        'churchName': p.get('church') or p.get('church_name') or '',
        'teamCode': team_code,
        'teamName': team_name,
        'roomNumber': room_number,
        'leadersId': [],
        'roommatesId': [],
        'isLeader': role == ROLE_LEADER,
        'isMaintainer': role == ROLE_MAINTAINER,
    }
