from typing import Optional, Dict
from passlib.context import CryptContext
import boto3
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).resolve().parents[2] / '.env'
print(f"Loading .env from: {env_path}")
load_dotenv(dotenv_path=env_path)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    def __init__(self):
        # Get AWS credentials
        aws_access_key_id = os.getenv('AWS_ACCESS_KEY_ID')
        aws_secret_access_key = os.getenv('AWS_SECRET_ACCESS_KEY')
        aws_region = os.getenv('AWS_REGION', 'us-east-1')
        
        if not aws_access_key_id or not aws_secret_access_key:
            raise ValueError("AWS credentials not found in environment variables")
            
        print("\nInitializing AuthService with AWS credentials:")
        print(f"AWS_ACCESS_KEY_ID: {'*' * len(aws_access_key_id)} (length: {len(aws_access_key_id)})")
        print(f"AWS_SECRET_ACCESS_KEY: {'*' * len(aws_secret_access_key)} (length: {len(aws_secret_access_key)})")
        print(f"AWS_REGION: {aws_region}")
        
        # Create a session with the credentials
        self.session = boto3.Session(
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            region_name=aws_region
        )
        
        # Create DynamoDB resource from session
        self.dynamodb = self.session.resource('dynamodb')
        self.table = self.dynamodb.Table('NotebookBuddy_NextAuth')
        
        # Test connection
        try:
            # Try to list tables to verify connection
            tables = list(self.dynamodb.tables.all())
            print("\nDynamoDB Connection Test:")
            print(f"Found {len(tables)} tables:")
            for table in tables:
                print(f"- {table.name}")
                
            # Try to get caller identity
            sts = self.session.client('sts')
            identity = sts.get_caller_identity()
            print(f"\nConnected as: {identity['Arn']}")
            
        except Exception as e:
            print(f"Error connecting to DynamoDB in AuthService: {str(e)}")
            print(f"Error type: {type(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            raise

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        return pwd_context.hash(password)

    def get_user_by_email(self, email: str) -> Optional[Dict]:
        """Get user from DynamoDB by email"""
        try:
            print(f"Getting user by email: {email}")
            response = self.table.get_item(
                Key={
                    'pk': f'USER#{email}',
                    'sk': f'USER#{email}'
                }
            )
            user = response.get('Item')
            print(f"Found user: {user is not None}")
            return user
        except Exception as e:
            print(f"Error getting user: {str(e)}")
            print(f"Error type: {type(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return None

    def create_user(self, email: str, password: str) -> Dict:
        """Create a new user in DynamoDB"""
        print(f"Creating user with email: {email}")
        hashed_password = self.get_password_hash(password)
        user = {
            'pk': f'USER#{email}',
            'sk': f'USER#{email}',
            'email': email,
            'hashed_password': hashed_password,
            'is_active': True,
            'is_demo': False  # Default to non-demo user
        }
        
        try:
            print(f"Putting user in DynamoDB: {user['pk']}")
            self.table.put_item(Item=user)
            print("User created successfully")
            return {
                'id': user['pk'],
                'email': user['email'],
                'is_active': user['is_active'],
                'is_demo': user.get('is_demo', False)
            }
        except Exception as e:
            print(f"Error creating user: {str(e)}")
            print(f"Error type: {type(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            raise

    def authenticate_user(self, email: str, password: str) -> Optional[Dict]:
        """Authenticate user with email and password"""
        user = self.get_user_by_email(email)
        if not user:
            return None
        if not self.verify_password(password, user['hashed_password']):
            return None
        return {
            'id': user['pk'],
            'email': user['email'],
            'is_active': user['is_active']
        }

    def update_user_demo_flag(self, email: str, is_demo: bool) -> None:
        """Update the demo flag for a user"""
        try:
            print(f"Updating demo flag for user {email} to {is_demo}")
            self.table.update_item(
                Key={
                    'pk': f'USER#{email}',
                    'sk': f'USER#{email}'
                },
                UpdateExpression='SET is_demo = :demo',
                ExpressionAttributeValues={
                    ':demo': is_demo
                }
            )
            print("Demo flag updated successfully")
        except Exception as e:
            print(f"Error updating demo flag: {str(e)}")
            print(f"Error type: {type(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            raise

    def get_user_demo_flag(self, email: str) -> bool:
        """Get the demo flag for a user"""
        try:
            user = self.get_user_by_email(email)
            if not user:
                return False
            return user.get("is_demo", False)
        except Exception as e:
            print(f"Error getting demo flag: {str(e)}")
            return False
