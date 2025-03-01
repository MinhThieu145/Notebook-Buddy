import os
from typing import Dict, Optional, List, Union
from anthropic import Anthropic

class AnthropicService:
    def __init__(self):
        self.client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        self.default_model = "claude-3-7-sonnet-20250219"

    def create_message(
        self,
        messages: List[Dict[str, str]],
        system: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        top_p: Optional[float] = None,
        metadata: Optional[Dict] = None,
    ) -> Dict:
        """
        Create a message using Anthropic's Claude API.
        
        Args:
            messages: List of message objects with role and content
            system: Optional system prompt
            max_tokens: Optional maximum number of tokens to generate
            temperature: Optional temperature parameter
            top_p: Optional top_p parameter
            metadata: Optional metadata to include
            
        Returns:
            Dict: The API response containing the generated message
        """
        try:
            # Build parameters dictionary, excluding None values
            params = {
                "messages": messages,
                "model": self.default_model,
                "max_tokens": max_tokens or 1024,
            }
            
            if system:
                params["system"] = system
            if temperature is not None:
                params["temperature"] = temperature
            if top_p is not None:
                params["top_p"] = top_p
            if metadata:
                params["metadata"] = metadata

            # Make API call
            response = self.client.messages.create(**params)
            
            # Return just the message content for simplicity
            return {
                "content": response.content[0].text,
                "model": response.model,
                "role": response.role,
            }
            
        except Exception as e:
            print(f"Error in create_message: {str(e)}")
            raise Exception(f"Error creating message: {str(e)}")

    def create_chat_completion(
        self,
        prompt: str,
        system: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
    ) -> Dict:
        """
        Simplified method for creating a single message chat completion.
        
        Args:
            prompt: The user's prompt
            system: Optional system prompt
            max_tokens: Optional maximum number of tokens to generate
            temperature: Optional temperature parameter
            
        Returns:
            Dict: The API response containing the generated message
        """
        messages = [{"role": "user", "content": prompt}]
        return self.create_message(
            messages=messages,
            system=system,
            max_tokens=max_tokens,
            temperature=temperature
        )
