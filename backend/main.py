from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import json
import os
from dotenv import load_dotenv
import anthropic
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()  # Ensure output goes to console
    ]
)
logger = logging.getLogger(__name__)

# Initialize Claude client
claude_api_key = os.getenv("CLAUDE_API_KEY")
claude_model = os.getenv("CLAUDE_MODEL", "claude-3-5-sonnet-20241022")

if not claude_api_key:
    logger.error("CLAUDE_API_KEY not found in environment variables")
    raise ValueError("CLAUDE_API_KEY not found in environment variables")

logger.info(f"Initializing Claude client with model: {claude_model}")
claude_client = anthropic.Anthropic(
    api_key=claude_api_key
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://10.224.120.172:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class Challenge(BaseModel):
    label: str
    description: str

class TrustedSource(BaseModel):
    name: str
    description: str

class ContentItem(BaseModel):
    title: str
    tags: List[str]
    source: str

class ContentCalibration(BaseModel):
    read: List[ContentItem]
    want: List[ContentItem]
    pass_on: List[ContentItem] = []

class UserProfile(BaseModel):
    category: str
    role: str
    challenges: List[Challenge]
    trustedSources: List[TrustedSource]
    contentCalibration: ContentCalibration
    timestamp: str

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI!"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

@app.post("/api/generate-persona")
async def generate_persona(user_profile: UserProfile):
    """
    Receives user profile data and generates a persona using AI model.
    Saves the generated persona to persona.json file.
    """
    logger.info("=== GENERATE PERSONA ENDPOINT CALLED ===")
    logger.info(f"User profile role: {user_profile.role}")
    logger.info(f"User profile category: {user_profile.category}")
    try:
        # Save user profile to JSON file
        profile_filename = f"user-profile-{user_profile.timestamp.replace(':', '-').replace('.', '-')}.json"
        with open(profile_filename, 'w') as f:
            json.dump(user_profile.model_dump(), f, indent=2)
        
        # Generate persona using Claude API
        persona_text = await generate_persona_with_claude(user_profile)
        
        # Create persona data for response
        persona_data = {
            "role": user_profile.role,
            "area": user_profile.category,
            "persona": persona_text,
            "generated_at": user_profile.timestamp
        }
        
        return {
            "status": "success",
            "message": "Persona generated successfully",
            "profile_saved": profile_filename,
            "persona_data": persona_data
        }
    
    except Exception as e:
        return {
            "status": "error", 
            "message": f"Failed to generate persona: {str(e)}"
        }

async def generate_persona_with_claude(profile: UserProfile) -> str:
    """
    Generate a personalized AI agent persona using Claude API.
    """
    try:
        # Prepare the prompt for Claude
        challenge_names = [c.label for c in profile.challenges]
        source_names = [s.name for s in profile.trustedSources]
        
        # Create content preference summary
        content_prefs = []
        
        # Analyze wants
        if profile.contentCalibration.want:
            want_titles = [item.title for item in profile.contentCalibration.want[:2]]
            content_prefs.append(f"wants to see content like: {', '.join(want_titles)}")
        
        # Analyze reads
        if profile.contentCalibration.read:
            read_titles = [item.title for item in profile.contentCalibration.read[:2]]
            content_prefs.append(f"already familiar with content like: {', '.join(read_titles)}")
            
        # Analyze passes
        if profile.contentCalibration.pass_on:
            pass_titles = [item.title for item in profile.contentCalibration.pass_on[:2]]
            content_prefs.append(f"wants to avoid content like: {', '.join(pass_titles)}")
        
        # Get first items for analysis
        primary_challenge = profile.challenges[0] if profile.challenges else None
        primary_source = profile.trustedSources[0] if profile.trustedSources else None
        primary_want = profile.contentCalibration.want[0] if profile.contentCalibration.want else None

        prompt = f"""
You are an expert User Persona Analyst and Cognitive Strategist. Your goal is to analyze user data to create a persona that deeply understands their underlying 'Information & Cognitive Needs'. This goes beyond topics; it's about understanding how they think, the mental models they need, and the "job" the information must do for them. The persona will power a sophisticated content recommendation engine.

First, perform a step-by-step analysis. Then, synthesize these steps into a final persona, paying close attention to the required output format.

---
## Dynamic User Data

* **Broad Category:** {profile.category}
* **Role & Seniority:** {profile.role}
* **Primary Challenge:** Label: {primary_challenge.label if primary_challenge else 'N/A'}, Description: {primary_challenge.description if primary_challenge else 'N/A'}
* **Trusted Source:** Name: {primary_source.name if primary_source else 'N/A'}, Description: {primary_source.description if primary_source else 'N/A'}
* **High-Value Content Signal (`want`):**
    * Title: {primary_want.title if primary_want else 'N/A'}
    * Tags: {primary_want.tags if primary_want else []}
    * Source: {primary_want.source if primary_want else 'N/A'}

---
## Reasoning Instructions

Based on the data provided, perform the following reasoning steps:

1.  **Infer Professional Context & Altitude:**
    * Deconstruct the user's role. What is the typical "altitude" of their decision-making (e.g., company-wide strategy, departmental execution)?
    * Based on their role, infer their relationship with technology. Are they a technical leader, a business leader leveraging tech, or a strategist? What level of technical detail do they need to be effective without being "in the weeds"?

2.  **Determine the Core "Job to be Done":**
    * Look at the Primary Challenge. This is the topic, but what is the underlying job? Is it to make a decision, persuade a team, de-risk a project, or understand a new domain?
    * Analyze the language—is it about growth ("Scaling ideas"), efficiency, or innovation?

3.  **Deconstruct the Cognitive Style:**
    * Analyze the Trusted Source and the High-Value Content Signal. Liking sources like "Ben Thompson" or content with tags like "Strategy", "AI", and "Economics" is a strong signal.
    * What does this imply? Infer their preference for mental models, strategic frameworks over simple tactics, and multi-dimensional analysis (tech + business + product).

4.  **Synthesize and Extrapolate Needs:**
    * Combine the insights from the previous steps. Create a cohesive narrative about this user's thinking process.
    * Extrapolate their needs. For example, a C-level executive focused on GTM for an AI product doesn't just need a GTM plan; they need to understand the economic moats of AI to build a *defensible* GTM strategy. They need to understand trade-offs to guide their product and engineering teams effectively. Project their need for strategic foresight (e.g., thinking 2-5 years ahead).

---
## Output Structure

Format your entire response using the following Markdown structure. Do NOT include your step-by-step analysis; provide only the final, clean persona.

**Executive Summary:**
(A 1-2 sentence summary of the user persona, focusing on their role and core intellectual drivers.)

**Information & Cognitive Needs:**
(Generate a bulleted list of 4-5 needs based on your synthesis. **IMPORTANT:** Each bullet point must be separated by a blank line for readability. Follow the example below.)

**EXAMPLE FORMAT:**
* This is the first bullet point. It might contain one or more sentences.

* This is the second bullet point. There is a clear blank line separating it from the first.

* This is the third bullet point, also separated by a blank line.
"""

        # Log input
        logger.info("\n" + "="*50)
        logger.info("CLAUDE API CALL INPUT")
        logger.info("="*50)
        logger.info(f"Model: {claude_model}")
        logger.info(f"Temperature: 0.7")
        logger.info(f"Max Tokens: 1000")
        logger.info("\n--- PROMPT START ---")
        logger.info(prompt)
        logger.info("--- PROMPT END ---")
        logger.info("="*50)

        # Call Claude API
        message = claude_client.messages.create(
            model=claude_model,
            max_tokens=1000,
            temperature=0.7,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        
        response_text = message.content[0].text
        
        # Log output
        logger.info("\n" + "="*50)
        logger.info("CLAUDE API CALL OUTPUT")
        logger.info("="*50)
        logger.info(f"Response length: {len(response_text)} characters")
        logger.info("\n--- RESPONSE START ---")
        logger.info(response_text)
        logger.info("--- RESPONSE END ---")
        logger.info("="*50 + "\n")
        
        return response_text
        
    except Exception as e:
        # Log error and fallback to mock persona if Claude API fails
        logger.error(f"Claude API error: {e}")
        logger.info("Falling back to mock persona generation")
        return generate_mock_persona(profile)

def generate_mock_persona(profile: UserProfile) -> str:
    """
    Generate a mock persona based on user profile data.
    In production, this would call an AI model.
    """
    challenge_names = [c.label for c in profile.challenges]
    source_names = [s.name for s in profile.trustedSources]
    
    persona = f"""# Your AI Agent Profile

As a **{profile.role}** focused on **{profile.category}** work, you're navigating complex challenges in today's dynamic business landscape.

## Your Focus Areas
You're particularly interested in **{', '.join(challenge_names[:2])}{"" if len(challenge_names) <= 2 else f", and {challenge_names[2]}"}**. These areas represent the core of where you're investing your time and energy right now.

## Your Information Diet
You trust insights from **{', '.join(source_names[:2])}{"" if len(source_names) <= 2 else f", and {source_names[2]}"}** to stay informed about industry trends and strategic developments.

## Content Preferences
Based on your calibration, you prefer content that is:
- **Actionable**: Practical insights you can implement
- **Strategic**: Big-picture thinking that informs decision-making  
- **Relevant**: Directly applicable to your current challenges

Your personalized feed will surface content that matches these preferences, helping you stay ahead of the curve while filtering out noise.

*This profile was generated based on your onboarding responses and will be used to curate your personalized content recommendations.*"""

    return persona

if __name__ == "__main__":
    logger.info("Starting FastAPI server with logging enabled")
    logger.info(f"Claude model: {claude_model}")
    logger.info(f"Claude API key configured: {'Yes' if claude_api_key else 'No'}")
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)