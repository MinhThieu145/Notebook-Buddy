from typing import Optional, Dict
from passlib.context import CryptContext
from .aws_config import nextauth_table

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    def __init__(self):
        self.table = nextauth_table

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

    def create_user(self, email: str, password: str | None = None, name: str | None = None, provider: str | None = None, provider_id: str | None = None) -> Dict:
        """Create a new user in DynamoDB"""
        print(f"Creating user with email: {email}, provider: {provider}")
        
        user = {
            'pk': f'USER#{email}',
            'sk': f'USER#{email}',
            'email': email,
            'name': name,
            'is_active': True,
            'is_demo': False,  # Default to non-demo user
        }

        # Add provider-specific fields
        if provider:
            user['provider'] = provider
            user['provider_id'] = provider_id
        else:
            # For email/password authentication
            if password is None:
                raise ValueError("Password is required for email authentication")
            user['hashed_password'] = self.get_password_hash(password)

        try:
            self.table.put_item(Item=user)
            return user
        except Exception as e:
            print(f"Error creating user: {str(e)}")
            print(f"Error type: {type(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            raise

    def authenticate_user(self, email: str, password: str) -> Optional[Dict]:
        """Authenticate a user with email and password"""
        user = self.get_user_by_email(email)
        if not user:
            return None
        if not user.get('hashed_password'):
            return None
        if not self.verify_password(password, user['hashed_password']):
            return None
        return user

    def update_user(self, email: str, update_data: Dict) -> Optional[Dict]:
        """Update user data in DynamoDB"""
        try:
            # Build update expression
            update_expr = "SET "
            expr_names = {}
            expr_values = {}
            
            for key, value in update_data.items():
                if key not in ['pk', 'sk', 'email']:  # Prevent updating key fields
                    update_expr += f"#{key} = :{key}, "
                    expr_names[f"#{key}"] = key
                    expr_values[f":{key}"] = value
            
            if not expr_values:  # No valid fields to update
                return None
                
            update_expr = update_expr.rstrip(", ")
            
            response = self.table.update_item(
                Key={
                    'pk': f'USER#{email}',
                    'sk': f'USER#{email}'
                },
                UpdateExpression=update_expr,
                ExpressionAttributeNames=expr_names,
                ExpressionAttributeValues=expr_values,
                ReturnValues="ALL_NEW"
            )
            
            return response.get('Attributes')
        except Exception as e:
            print(f"Error updating user: {str(e)}")
            print(f"Error type: {type(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return None
