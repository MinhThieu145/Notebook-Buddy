import uuid
from datetime import datetime
from decimal import Decimal
import logging
from .aws_config import aws_session

# Constants for table names
TABLE_NEXTAUTH = 'NotebookBuddy_NextAuth'
TABLE_USER = 'NotebookBuddy_User'
TABLE_TEXT_BLOCKS = 'NotebookBuddy_TextBlocks'

logger = logging.getLogger(__name__)

def convert_decimal(obj):
    """Convert Decimal objects to strings in a nested structure"""
    if isinstance(obj, dict):
        return {k: convert_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_decimal(i) for i in obj]
    elif isinstance(obj, Decimal):
        return str(obj)
    return obj

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
            # Create DynamoDB resource from session
            self.dynamodb = aws_session.resource('dynamodb')
            
            # Test connection by listing tables
            tables = list(self.dynamodb.tables.all())
            print("\nDynamoDB Connection Test:")
            print(f"Found {len(tables)} tables:")
            for table in tables:
                print(f"- {table.name}")
                
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

class DynamoDBService:
    def __init__(self):
        self.table = dynamodb_manager.get_table(TABLE_USER)
        self.text_blocks_table = dynamodb_manager.get_table(TABLE_TEXT_BLOCKS)

    def create_user_project(self):
        """
        Create a new user project with generated Uid and projectId
        Returns:
            dict: The created item including Uid and projectId
        """
        uid = str(uuid.uuid4())
        project_id = str(uuid.uuid4())
        date_created = datetime.utcnow().isoformat()

        item = {
            'Uid': uid,
            'projectId': project_id,
            'dateCreated': date_created
        }

        try:
            self.table.put_item(Item=item)
            return item
        except Exception as e:
            raise Exception(f"Error creating user project: {str(e)}")

    def get_user_project(self, uid, project_id):
        """
        Get a user project by Uid and projectId
        Args:
            uid (str): User ID
            project_id (str): Project ID
        Returns:
            dict: The retrieved item
        """
        try:
            response = self.table.get_item(
                Key={
                    'Uid': uid,
                    'projectId': project_id
                }
            )
            return response.get('Item')
        except Exception as e:
            raise Exception(f"Error retrieving user project: {str(e)}")

    def save_project(self, item):
        """
        Save a project to DynamoDB
        Args:
            item (dict): The project item to save
        Returns:
            dict: The saved item
        """
        try:
            table = dynamodb_manager.get_table('NotebookBuddy_Project')
            table.put_item(Item=item)
            return item
        except Exception as e:
            raise Exception(f"Error saving project: {str(e)}")

    def get_user_projects(self, user_id):
        """
        Get all projects for a user
        Args:
            user_id (str): The user ID
        Returns:
            list: List of project items with Decimal values converted to strings
        """
        try:
            table = dynamodb_manager.get_table('NotebookBuddy_Project')
            
            # First try using the GSI
            try:
                response = table.query(
                    IndexName='userId-index',
                    KeyConditionExpression='userId = :uid',
                    ExpressionAttributeValues={
                        ':uid': user_id
                    }
                )
                items = response.get('Items', [])
                if items:
                    return convert_decimal(items)
            except Exception as e:
                print(f"GSI query failed: {str(e)}")
                
            # If GSI query fails or returns no items, try scanning
            response = table.scan(
                FilterExpression='userId = :uid',
                ExpressionAttributeValues={
                    ':uid': user_id
                }
            )
            items = response.get('Items', [])
            return convert_decimal(items)
        except Exception as e:
            raise Exception(f"Error getting user projects: {str(e)}")

    def get_text_blocks(self, project_id: str):
        """
        Get all text blocks for a project
        Args:
            project_id (str): Project ID
        Returns:
            list: List of text blocks sorted by order
        """
        try:
            response = self.text_blocks_table.query(
                KeyConditionExpression='projectId = :pid',
                ExpressionAttributeValues={
                    ':pid': project_id
                }
            )
            blocks = convert_decimal(response.get('Items', []))
            
            # Transform blocks to match client expectations
            transformed_blocks = []
            for block in blocks:
                transformed_blocks.append({
                    'id': str(block.get('textBlockId')),  # Ensure string ID
                    'content': block.get('content', ''),
                    'order': int(block.get('order', 0))  # Ensure integer order
                })
            
            # Sort blocks by order field
            sorted_blocks = sorted(transformed_blocks, key=lambda x: x.get('order', float('inf')))
            logger.info(f"Retrieved {len(sorted_blocks)} blocks for project {project_id}")
            return sorted_blocks
        except Exception as e:
            logger.error(f"Error getting text blocks: {str(e)}")
            raise Exception(f"Error getting text blocks: {str(e)}")

    def save_text_block(self, project_id: str, block_id: str, content: str, order: int):
        """
        Save a text block for a project
        Args:
            project_id (str): Project ID
            block_id (str): Block ID
            content (str): Block content
            order (int): Block order position
        Returns:
            dict: The saved text block
        """
        try:
            # Ensure block_id is a string and order is an integer
            block_id = str(block_id)
            order = int(order)
            
            item = {
                'projectId': project_id,
                'textBlockId': block_id,
                'content': content,
                'order': order,
                'updatedAt': datetime.utcnow().isoformat()
            }
            
            logger.info(f"Saving block {block_id} with order {order}")
            self.text_blocks_table.put_item(Item=item)
            
            # Return the saved item with the expected format
            return {
                'id': block_id,
                'content': content,
                'order': order
            }
        except Exception as e:
            logger.error(f"Error saving text block: {str(e)}")
            raise Exception(f"Error saving text block: {str(e)}")

    def delete_text_block(self, project_id: str, block_id: str):
        """
        Delete a text block
        Args:
            project_id (str): Project ID
            block_id (str): Block ID
        """
        try:
            self.text_blocks_table.delete_item(
                Key={
                    'projectId': project_id,
                    'textBlockId': block_id
                }
            )
        except Exception as e:
            raise Exception(f"Error deleting text block: {str(e)}")
