import uuid
from datetime import datetime
from .aws_config import dynamodb_manager, TABLE_USER

class DynamoDBService:
    def __init__(self):
        self.table = dynamodb_manager.get_table(TABLE_USER)

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
            list: List of project items
        """
        try:
            table = dynamodb_manager.get_table('NotebookBuddy_Project')
            response = table.query(
                IndexName='userId-index',  # You'll need to create this GSI
                KeyConditionExpression='userId = :uid',
                ExpressionAttributeValues={
                    ':uid': user_id
                }
            )
            return response.get('Items', [])
        except Exception as e:
            raise Exception(f"Error retrieving user projects: {str(e)}")
