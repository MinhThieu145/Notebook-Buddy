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

# Debug print to verify environment variables
print(f"AWS_ACCESS_KEY_ID loaded: {'*' * len(os.getenv('AWS_ACCESS_KEY_ID', ''))} (length: {len(os.getenv('AWS_ACCESS_KEY_ID', ''))})")

class DynamoDBManager:
    _instance = None
    _tables = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DynamoDBManager, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        """Initialize the DynamoDB resource"""
        try:
            # Create a session with the credentials
            session = boto3.Session(
                aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
                aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
                region_name=os.getenv('AWS_REGION', 'us-east-1')
            )
            
            # Create DynamoDB resource from session
            self.dynamodb = session.resource('dynamodb')
            
            # Test connection by listing tables
            tables = list(self.dynamodb.tables.all())
            print("\nDynamoDB Connection Test:")
            print(f"Found {len(tables)} tables:")
            for table in tables:
                print(f"- {table.name}")
                
            # Try to get caller identity
            sts = session.client('sts')
            identity = sts.get_caller_identity()
            print(f"\nConnected as: {identity['Arn']}")
            
        except Exception as e:
            print(f"Error initializing DynamoDB: {str(e)}")
            print(f"Error type: {type(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            raise

    def get_table(self, table_name: str):
        """
        Get a DynamoDB table instance. Caches the table reference.
        Args:
            table_name (str): Name of the DynamoDB table
        Returns:
            Table: DynamoDB table instance
        """
        if table_name not in self._tables:
            self._tables[table_name] = self.dynamodb.Table(table_name)
        return self._tables[table_name]

# Create a singleton instance
dynamodb_manager = DynamoDBManager()

# Constants for table names
TABLE_NEXTAUTH = 'NotebookBuddy_NextAuth'
TABLE_USER = 'NotebookBuddy_User'
