from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
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
claude_model = os.getenv("CLAUDE_MODEL", "claude-opus-4-1-20250805")

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

class PersonaRequest(BaseModel):
    persona: str
    timestamp: str

class ContentPoolRequest(BaseModel):
    persona: str
    scoring_dimensions: str
    timestamp: str

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI!"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

@app.get("/api/video/{video_id}")
def get_video_metadata(video_id: str):
    """
    Get video metadata by videoId from the top10_metadata.json file.
    """
    try:
        # Load candidates from top10_metadata.json
        candidates_path = "/home/jianfengliu/rundown_pipeline/demo_0825/top10_metadata.json"
        with open(candidates_path, 'r') as f:
            candidates_data = json.load(f)
        
        # Find the video by ID
        video = next((item for item in candidates_data if item["videoId"] == video_id), None)
        
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        
        return {
            "status": "success",
            "video": video
        }
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Video metadata file not found")
    except Exception as e:
        logger.error(f"Error fetching video metadata: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch video metadata: {str(e)}")

@app.get("/api/content/{video_id}/article", response_class=PlainTextResponse)
def get_video_article(video_id: str):
    """
    Get article content for a specific video from the demo_0825 directory.
    """
    try:
        article_path = f"/home/jianfengliu/rundown_pipeline/demo_0825/{video_id}_article.md"
        
        if not os.path.exists(article_path):
            raise HTTPException(status_code=404, detail="Article not found")
        
        with open(article_path, 'r', encoding='utf-8') as f:
            article_content = f.read()
        
        return article_content
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Article file not found")
    except Exception as e:
        logger.error(f"Error fetching article content: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch article content: {str(e)}")

@app.get("/api/content/{video_id}/insights")
def get_video_insights(video_id: str):
    """
    Get key insights for a specific video from the demo_0825 directory.
    """
    try:
        insights_path = f"/home/jianfengliu/rundown_pipeline/demo_0825/{video_id}_keyInsights.json"
        
        if not os.path.exists(insights_path):
            raise HTTPException(status_code=404, detail="Key insights not found")
        
        with open(insights_path, 'r', encoding='utf-8') as f:
            insights_data = json.load(f)
        
        return insights_data
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Key insights file not found")
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing JSON insights file: {e}")
        raise HTTPException(status_code=500, detail="Invalid insights file format")
    except Exception as e:
        logger.error(f"Error fetching key insights: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch key insights: {str(e)}")

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
        
        # Save persona to file for later use
        persona_filename = f"persona-{user_profile.timestamp.replace(':', '-').replace('.', '-')}.json"
        with open(persona_filename, 'w') as f:
            json.dump(persona_data, f, indent=2)
        
        return {
            "status": "success",
            "message": "Persona generated successfully",
            "profile_saved": profile_filename,
            "persona_saved": persona_filename,
            "persona_data": persona_data
        }
    
    except Exception as e:
        return {
            "status": "error", 
            "message": f"Failed to generate persona: {str(e)}"
        }

@app.post("/api/generate-scoring-dimensions")
async def generate_scoring_dimensions(persona_request: PersonaRequest):
    """
    Receives a persona and generates scoring dimensions using AI model.
    Saves the generated scoring dimensions to a JSON file.
    """
    logger.info("=== GENERATE SCORING DIMENSIONS ENDPOINT CALLED ===")
    logger.info(f"Persona length: {len(persona_request.persona)} characters")
    try:
        # Generate scoring dimensions using Claude API
        scoring_dimensions_text = await generate_scoring_dimensions_with_claude(persona_request.persona)
        
        # Create scoring dimensions data for response
        scoring_data = {
            "persona": persona_request.persona,
            "scoring_dimensions": scoring_dimensions_text,
            "generated_at": persona_request.timestamp
        }
        
        # Save scoring dimensions to file
        scoring_filename = f"scoring-dimensions-{persona_request.timestamp.replace(':', '-').replace('.', '-')}.json"
        with open(scoring_filename, 'w') as f:
            json.dump(scoring_data, f, indent=2)
        
        return {
            "status": "success",
            "message": "Scoring dimensions generated successfully",
            "scoring_saved": scoring_filename,
            "scoring_data": scoring_data
        }
    
    except Exception as e:
        return {
            "status": "error", 
            "message": f"Failed to generate scoring dimensions: {str(e)}"
        }

@app.post("/api/content-pool-ranking")
async def content_pool_ranking(request: ContentPoolRequest):
    """
    Ranks content pool using persona and scoring dimensions.
    Loads candidates from top10_metadata.json and evaluates using Claude API.
    """
    logger.info("=== CONTENT POOL RANKING ENDPOINT CALLED ===")
    logger.info(f"Persona length: {len(request.persona)} characters")
    logger.info(f"Scoring dimensions length: {len(request.scoring_dimensions)} characters")
    try:
        # Load candidates from top10_metadata.json
        candidates_path = "/home/jianfengliu/rundown_pipeline/demo_0825/top10_metadata.json"
        with open(candidates_path, 'r') as f:
            candidates_data = json.load(f)
        
        # Prepare candidates for ranking (extract only specified fields)
        candidates_for_ranking = []
        for item in candidates_data:
            candidate = {
                "videoId": item["videoId"],
                "title": item["title"],
                "author": item["author"],
                "description": item.get("description", "")[:500] + "..." if len(item.get("description", "")) > 500 else item.get("description", "")  # Truncate long descriptions
            }
            candidates_for_ranking.append(candidate)
        
        # Generate ranking using Claude API
        ranking_results = await rank_content_with_claude(candidates_for_ranking, request.scoring_dimensions)
        
        # Create ranking data for response
        ranking_data = {
            "persona": request.persona,
            "scoring_dimensions": request.scoring_dimensions,
            "ranking_results": ranking_results,
            "candidates_count": len(candidates_for_ranking),
            "generated_at": request.timestamp
        }
        
        # Save ranking results to file
        ranking_filename = f"content-ranking-{request.timestamp.replace(':', '-').replace('.', '-')}.json"
        with open(ranking_filename, 'w') as f:
            json.dump(ranking_data, f, indent=2)
        
        return {
            "status": "success",
            "message": "Content pool ranking completed successfully",
            "ranking_saved": ranking_filename,
            "ranking_data": ranking_data
        }
    
    except Exception as e:
        logger.error(f"Content pool ranking error: {e}")
        return {
            "status": "error", 
            "message": f"Failed to rank content pool: {str(e)}"
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
        # Log error and re-raise - no mock data fallback
        logger.error(f"Claude API error: {e}")
        raise e

async def generate_scoring_dimensions_with_claude(persona: str) -> str:
    """
    Generate personalized scoring dimensions using Claude API based on persona.
    """
    try:
        # Prepare the scoring dimension prompt
        prompt = f"""You are an intelligent content ranking system. Your goal is to move beyond generic keywords and rank content based on its true utility to a specific professional persona. To do this, you will translate a persona's role, focus, and cognitive needs into a weighted scoring framework.
========================
## Persona:

{persona}
========================

Follow this process:

## Step 1: Identify the Core Professional Challenge

Analyze the fundamental challenge this persona faces in their professional reality. Look beyond surface-level needs to understand the deeper game they're playing.

**1a. Decode the Operational Reality:**
- **The Arena:** What competitive environment are they operating in? What are the rules of success?
- **The Stakes:** What happens if they succeed? What happens if they fail? What's the cost of inaction?
- **The Timeline:** Are they operating on quarterly cycles, multi-year transformations, or daily firefighting?
- **The Constraints:** What limitations shape their choices? (knowledge gaps, organizational inertia, market forces, stakeholder expectations)

**1b. Read Between the Lines for Hidden Context:**
Look for implicit signals that reveal their true situation:
- Language patterns that suggest their organizational maturity (e.g., "at scale" = enterprise, "defensible" = competitive pressure)
- Tension points between different needs (e.g., "velocity" vs. "governance" = struggling with pace vs. control)
- Sophistication indicators (e.g., "economics of AI moats" = beyond basic AI understanding)
- Stakeholder clues (e.g., "VC-grade analysis" = reporting to investors/board)
- Urgency markers (e.g., "market execution" = implementation pressure, not just planning)

**1c. Map What They're Really Seeking:**
Beyond information, what is this persona trying to achieve through content?
- **Navigation:** Finding paths through uncharted territory
- **Validation:** Confirming their instincts and strategies are sound
- **Acceleration:** Moving faster on familiar problems with proven patterns
- **Elevation:** Rising above tactical details to see strategic patterns
- **Translation:** Converting technical complexity into business language
- **Conviction:** Building confidence for high-stakes, irreversible decisions
- **Protection:** Avoiding predictable failures and managing downside risk

**1d. Identify the Intellectual Support Needed:**
Based on their challenge, what types of thinking do they need help with?
- **Synthesis:** Combining disparate information into coherent strategies
- **Analysis:** Breaking down complex systems into understandable components
- **Evaluation:** Assessing options against multiple competing criteria
- **Prediction:** Anticipating future states and second-order effects
- **Framing:** Creating mental models that simplify decision-making
- **Narrative Construction:** Building stories that align stakeholders

## Step 2: Identify the Core Intellectual Jobs

Based on the professional challenge analysis, determine the 2-4 fundamental "intellectual jobs" the persona is "hiring" content to perform. These aren't just information categories—they're cognitive functions the content must fulfill:

Examples of intellectual jobs:
- **Pattern Recognition:** Help me see what's signal vs. noise
- **Decision Confidence:** Give me conviction in high-stakes choices
- **Mental Model Construction:** Build my intuition for how this domain works
- **Risk Calibration:** Help me understand what could go wrong and how likely
- **Narrative Building:** Help me explain and sell this internally/externally
- **Option Generation:** Expand my sense of what's possible
- **Constraint Navigation:** Show me how to work within my limitations

## Step 3: Define Scoring Dimensions Based on Intellectual Value

Transform each intellectual job into a scoring dimension. Use language that reflects the cognitive value, not just the topic area.

Frame each dimension around the intellectual outcome:
- Instead of "Strategic Frameworks" → "Strategic Decision Architecture"
- Instead of "Market Analysis" → "Market Signal Interpretation"
- Instead of "Best Practices" → "Risk-Validated Playbooks"

## Step 4: Weight Dimensions by Challenge Criticality

Assign weights (totaling 100%) based on which aspects of their core professional challenge are most critical:

Consider:
- **Urgency Tax:** Which intellectual job has the highest time pressure?
- **Complexity Premium:** Which job involves the most variables and unknowns?
- **Stakes Multiplier:** Which job has the highest cost of being wrong?
- **Frequency Factor:** Which job occurs most often in their workflow?

## Step 5: Finalize the Output with Intellectual Clarity

For each dimension, write a definition that explicitly states the intellectual job being performed. Frame as a question that reveals what cognitive work the content accomplishes. The question should help identify content that genuinely reduces cognitive burden rather than just covering a topic.

========================
## Output Format:
**OUTPUT ONLY THE FOLLOWING - NO ADDITIONAL SECTIONS, ANALYSIS, OR COMMENTARY:**

Return EXACTLY 2-4 numbered dimensions in this markdown format:

1. **[Dimension Name]** (XX%) - *[Question that identifies if content performs this intellectual job]*

2. **[Dimension Name]** (XX%) - *[Question that identifies if content performs this intellectual job]*

3. **[Dimension Name]** (XX%) - *[Question that identifies if content performs this intellectual job]*

4. **[Dimension Name]** (XX%) - *[Question that identifies if content performs this intellectual job]*

Note: Weights must total 100%. Include brief focus points under each dimension if needed, but NO separate analysis sections, NO application notes, NO additional commentary."""

        # Log input
        logger.info("\n" + "="*50)
        logger.info("CLAUDE API CALL INPUT - SCORING DIMENSIONS")
        logger.info("="*50)
        logger.info(f"Model: {claude_model}")
        logger.info(f"Temperature: 0.7")
        logger.info(f"Max Tokens: 1500")
        logger.info("\n--- SCORING DIMENSIONS PROMPT START ---")
        logger.info(prompt)
        logger.info("--- SCORING DIMENSIONS PROMPT END ---")
        logger.info("="*50)

        # Call Claude API
        message = claude_client.messages.create(
            model=claude_model,
            max_tokens=1500,
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
        logger.info("CLAUDE API CALL OUTPUT - SCORING DIMENSIONS")
        logger.info("="*50)
        logger.info(f"Response length: {len(response_text)} characters")
        logger.info("\n--- SCORING DIMENSIONS RESPONSE START ---")
        logger.info(response_text)
        logger.info("--- SCORING DIMENSIONS RESPONSE END ---")
        logger.info("="*50 + "\n")
        
        return response_text
        
    except Exception as e:
        # Log error and re-raise - no mock data fallback
        logger.error(f"Claude API error for scoring dimensions: {e}")
        raise e



async def rank_content_with_claude(candidates: List[Dict[Any, Any]], framework: str) -> Dict[str, Any]:
    """
    Rank content using Claude API with the specified evaluation framework.
    """
    try:
        # Prepare the ranking prompt
        candidates_json = json.dumps(candidates, indent=2)
        
        prompt = f"""You are an expert in evaluating and ranking content for AI-native product builders.  
Your task is to assess each item in the candidates list using the evaluation framework below.  

For every content item:  
- Score each criterion (dimension) on a scale of 1–5.  
- Provide a short reasoning for each score.  
- Apply the specified weights from the framework to calculate a final weighted score (rounded to two decimal places).  

After evaluating all items:  
- Output the results as a JSON array of objects.  
- Each object must be indexed by `videoId`.  
- For each `videoId`, include:  
  - `scores`: an object containing all framework dimensions, where each dimension has:  
    - `score` (1–5)  
    - `reasoning` (brief explanation)  
  - `final_weighted_score`: the computed weighted score for that item.  

=============================
### Candidates List:
{candidates_json}

=============================
### Evaluation Framework:
{framework}

=============================
### Output Format:
Return only a JSON array of objects in this format (dimensions adapt dynamically from the framework provided):  

```json
[
  {{
    "videoId": "<id>",
    "final_weighted_score": 4.62,
    "scores": {{
      "<Dimension 1>": {{
        "score": 4,
        "reasoning": "Brief explanation tied to framework dimension 1."
      }},
      "<Dimension 2>": {{
        "score": 5,
        "reasoning": "Brief explanation tied to framework dimension 2."
      }}
    }}
  }}
]
```"""

        # Log input
        logger.info("\n" + "="*50)
        logger.info("CLAUDE API CALL INPUT - CONTENT RANKING")
        logger.info("="*50)
        logger.info(f"Model: {claude_model}")
        logger.info(f"Temperature: 0.3")
        logger.info(f"Max Tokens: 3000")
        logger.info(f"Candidates count: {len(candidates)}")
        logger.info("\n--- CONTENT RANKING PROMPT START ---")
        logger.info(prompt)
        logger.info("--- CONTENT RANKING PROMPT END ---")
        logger.info("="*50)

        # Call Claude API
        message = claude_client.messages.create(
            model=claude_model,
            max_tokens=3000,
            temperature=0.3,
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
        logger.info("CLAUDE API CALL OUTPUT - CONTENT RANKING")
        logger.info("="*50)
        logger.info(f"Response length: {len(response_text)} characters")
        logger.info("\n--- CONTENT RANKING RESPONSE START ---")
        logger.info(response_text)
        logger.info("--- CONTENT RANKING RESPONSE END ---")
        logger.info("="*50 + "\n")
        
        # Parse JSON response
        try:
            # Extract JSON from response (handle potential markdown code blocks)
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                json_text = response_text[json_start:json_end].strip()
            elif "[" in response_text:
                json_start = response_text.find("[")
                json_end = response_text.rfind("]") + 1
                json_text = response_text[json_start:json_end]
            else:
                json_text = response_text
                
            ranking_data = json.loads(json_text)
            
            return {
                "ranked_content": ranking_data,
                "total_items": len(candidates),
                "processing_summary": f"Successfully ranked {len(candidates)} content items using Claude API"
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Claude response as JSON: {e}")
            logger.error(f"Raw response: {response_text}")
            return {
                "error": "Failed to parse ranking results",
                "raw_response": response_text,
                "total_items": len(candidates)
            }
        
    except Exception as e:
        logger.error(f"Claude API error for content ranking: {e}")
        raise e


if __name__ == "__main__":
    logger.info("Starting FastAPI server with logging enabled")
    logger.info(f"Claude model: {claude_model}")
    logger.info(f"Claude API key configured: {'Yes' if claude_api_key else 'No'}")
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)