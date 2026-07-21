import os
import json
import boto3
from botocore.exceptions import ClientError
from util import json_response

ddb = boto3.resource('dynamodb')
PARTICIPANTS_TABLE = os.environ.get('ATTENDEES_TABLE', '')

def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        return json_response(400, {'message': 'Invalid JSON'})

    user_id = (body.get('id') or '').strip()
    phone = (body.get('phone') or '').strip()
    
    if not user_id:
        return json_response(400, {'message': 'Missing id'})

    table = ddb.Table(PARTICIPANTS_TABLE)
    
    try:
        table.update_item(
            Key={'id': user_id},
            UpdateExpression="set phone = :p",
            ExpressionAttributeValues={
                ':p': phone
            },
            ConditionExpression="attribute_exists(id)"
        )
        return json_response(200, {'message': 'Profile updated'})
    except ClientError as err:
        if err.response['Error']['Code'] == 'ConditionalCheckFailedException':
            return json_response(404, {'message': 'Unknown id'})
        print(err)
        return json_response(500, {'message': 'Server error'})
    except Exception as err:
        print(err)
        return json_response(500, {'message': 'Server error'})
