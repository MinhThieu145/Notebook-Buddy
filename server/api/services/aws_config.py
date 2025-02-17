import boto3
from botocore.config import Config
import os
from dotenv import load_dotenv
from pathlib import Path

# Get the absolute path to the .env file
env_path = Path(__file__).resolve().parents[2] / '.env'
print(f"Loading .env from: {env_path}")  # Debug print

# Load environment variables
load_dotenv(dotenv_path=env_path)

# Constants for table names
TABLE_NEXTAUTH = 'NotebookBuddy_NextAuth'

def create_aws_session():
    """Create and return an AWS session with configured credentials"""
    try:
        # Get AWS credentials
        aws_access_key_id = os.getenv('AWS_ACCESS_KEY_ID')
        aws_secret_access_key = os.getenv('AWS_SECRET_ACCESS_KEY')
        aws_region = os.getenv('AWS_REGION', 'us-east-1')
        
        if not aws_access_key_id or not aws_secret_access_key:
            raise ValueError("AWS credentials not found in environment variables")
            
        print("\nInitializing AWS Session with credentials:")
        print(f"AWS_ACCESS_KEY_ID: {'*' * len(aws_access_key_id)} (length: {len(aws_access_key_id)})")
        print(f"AWS_SECRET_ACCESS_KEY: {'*' * len(aws_secret_access_key)} (length: {len(aws_secret_access_key)})")
        print(f"AWS_REGION: {aws_region}")
        
        session = boto3.Session(
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            region_name=aws_region
        )
        
        # Test connection by getting caller identity
        sts = session.client('sts')
        identity = sts.get_caller_identity()
        print(f"\nConnected as: {identity['Arn']}")
        
        return session
    except Exception as e:
        print(f"Error creating AWS session: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise

# Create a global session
aws_session = create_aws_session()

# Initialize DynamoDB resource and tables
dynamodb = aws_session.resource('dynamodb')
nextauth_table = dynamodb.Table(TABLE_NEXTAUTH)

# Test DynamoDB connection
try:
    tables = list(dynamodb.tables.all())
    print("\nDynamoDB Connection Test:")
    print(f"Found {len(tables)} tables:")
    for table in tables:
        print(f"- {table.name}")
except Exception as e:
    print(f"Error connecting to DynamoDB: {str(e)}")
    print(f"Error type: {type(e)}")
    import traceback
    print(f"Traceback: {traceback.format_exc()}")
    raise
