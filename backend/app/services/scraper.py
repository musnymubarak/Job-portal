import requests
from bs4 import BeautifulSoup
from pydantic import BaseModel
from typing import Optional, List

class ScrapedJob(BaseModel):
    title: str = ""
    company: str = ""
    location: str = ""
    job_type: str = ""
    description: str = ""
    requirements: str = ""
    
    # Optional fields for better population
    salary: str = ""
    posted_date: str = ""

def scrape_job_details(url: str) -> ScrapedJob:
    try:
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        job = ScrapedJob()
        
        # 1. Title Extraction
        # Try meta tags first
        og_title = soup.find("meta", property="og:title")
        if og_title:
            job.title = og_title.get("content", "").split("|")[0].strip()
        
        # Fallback to common selectors if meta fails or is generic
        if not job.title:
            for selector in ['h1', '.job-title', '.position-title', '[class*="title"]']:
                element = soup.select_one(selector)
                if element:
                    job.title = element.get_text(strip=True)
                    break

        # 2. Company Extraction
        og_site_name = soup.find("meta", property="og:site_name")
        if og_site_name:
            job.company = og_site_name.get("content", "")
            
        if not job.company:
             for selector in ['.company-name', '.employer', '[class*="company"]']:
                element = soup.select_one(selector)
                if element:
                    job.company = element.get_text(strip=True)
                    break

        # 3. Location Extraction
        # Try specific markers first
        location_keywords = ['location', 'based in', 'office']
        for selector in ['.location', '.job-location', '[class*="location"]', 'span[class*="loc"]']:
             element = soup.select_one(selector)
             if element:
                 text = element.get_text(strip=True)
                 # simple filter to avoid long banners
                 if len(text) < 100: 
                    job.location = text
                    break

        # Fallback: Check title for parens e.g. "Engineer (Estonia)"
        if not job.location and '(' in job.title:
            import re
            match = re.search(r'\(([^)]+)\)', job.title)
            if match:
                possible_loc = match.group(1)
                # heuristic: locations usually aren't verbs
                if len(possible_loc) < 30:
                    job.location = possible_loc

        # 4. Description Extraction
        # Strategy A: Semantic containers
        description_selectors = [
            '.job-description', '#job-description', 
            '[class*="description"]', '[class*="job-body"]',
            'article', 'main'
        ]
        
        found_desc = False
        for selector in description_selectors:
            element = soup.select_one(selector)
            if element:
                # Cleanup
                for tag in element(["script", "style", "nav", "header", "footer"]):
                    tag.decompose()
                
                text = element.get_text(separator="\n", strip=True)
                # validation: needs to be long enough
                if len(text) > 200:
                    job.description = text
                    found_desc = True
                    break
        
        # Strategy B: Keyword Headers (common in un-classed sites like rootcode)
        if not found_desc:
            # simple heuristic: find a header 'About' or 'Description' then take everything after
            keywords = ['description', 'what you will do', 'responsibilities', 'requirements', 'about the role']
            for tag in soup.find_all(['h2', 'h3', 'h4', 'strong']):
                if any(k in tag.get_text().lower() for k in keywords):
                    # Found a start marker. Collect next siblings until end or huge gap
                    content = []
                    curr = tag.next_sibling
                    while curr:
                        if curr.name in ['script', 'style', 'nav', 'footer']:
                            curr = curr.next_sibling
                            continue
                        
                        text = curr.get_text(separator="\n", strip=True) if hasattr(curr, 'get_text') else str(curr).strip()
                        if text:
                            content.append(text)
                        
                        curr = curr.next_sibling
                        if len(content) > 20: # cap it
                            break
                    
                    if content:
                        job.description = "\n".join(content)
                        break

        return job
        
    except Exception as e:
        print(f"Scraping Error: {e}")
        # Return empty job object on error or re-raise if critical
        # For this feature, partial data is better than crash, so return what we have (empty)
        return ScrapedJob()
