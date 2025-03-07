import re
import requests
from bs4 import BeautifulSoup
import validators
from colorama import Fore, Style, init
import json
from typing import List, Dict, Union
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import streamlit as st
import base64
import io
import csv
import datetime

# Initialize colorama for colored output
init()

class SecurityScanner:
    def __init__(self):
        # Define risk level colors for HTML display
        self.risk_colors = {
            'Critical': '#FF0000',  # Red
            'High': '#FF00FF',      # Magenta
            'Medium': '#FFFF00',    # Yellow
            'Low': '#00FF00'        # Green
        }
        
        # Common vulnerability patterns
        self.patterns = {
            'sql_injection': [
                r'SELECT.*FROM.*WHERE',
                r'INSERT\s+INTO',
                r'UPDATE.*SET',
                r'DELETE\s+FROM',
                r'UNION\s+SELECT',
            ],
            'xss': [
                r'<script.*?>',
                r'javascript:',
                r'onerror=',
                r'onload=',
                r'eval\(',
                r'\b(?:document\.write|innerHTML|outerHTML|insertAdjacentHTML)\b',
            ],
            'exposed_secrets': [
                r'api[_-]?key',
                r'secret[_-]?key',
                r'password',
                r'aws[_-]?key',
                r'credentials',
            ],
            'insecure_configs': [
                r'debug\s*=\s*true',
                r'ALLOW_ALL_ORIGINS',
                r'JWT_SECRET',
            ]
        }

    def analyze_code(self, code: str) -> List[Dict]:
        """Analyze source code for potential vulnerabilities."""
        vulnerabilities = []
        lines = code.split('\n')  # Split code into lines for location tracking
        
        # Check for SQL Injection
        for line_number, line in enumerate(lines):
            if any(re.search(pattern, line, re.I) for pattern in self.patterns['sql_injection']):
                if 'parameterized' not in line.lower() and 'prepare' not in line.lower():
                    vulnerabilities.append({
                        'type': 'SQL Injection',
                        'risk_level': 'Critical',
                        'description': 'Potential SQL injection vulnerability detected. Raw SQL queries found without proper parameterization.',
                        'location': f'Line {line_number + 1}',
                        'fix': 'Use parameterized queries or an ORM to prevent SQL injection:\n' + \
                              'cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))'
                    })

        # Check for XSS
        for line_number, line in enumerate(lines):
            if any(re.search(pattern, line, re.I) for pattern in self.patterns['xss']):
                if 'escape' not in line.lower() and 'sanitize' not in line.lower():
                    vulnerabilities.append({
                        'type': 'Cross-Site Scripting (XSS)',
                        'risk_level': 'High',
                        'description': 'Potential XSS vulnerability. Unescaped user input could be executed as JavaScript.',
                        'location': f'Line {line_number + 1}',
                        'fix': 'Escape all user input before rendering:\n' + \
                              'from html import escape\n' + \
                              'escaped_content = escape(user_input)'
                    })

        # Check for exposed secrets
        for line_number, line in enumerate(lines):
            if any(re.search(pattern, line, re.I) for pattern in self.patterns['exposed_secrets']):
                vulnerabilities.append({
                    'type': 'Exposed Secrets',
                    'risk_level': 'Critical',
                    'description': 'Potential exposed secrets or credentials in code.',
                    'location': f'Line {line_number + 1}',
                    'fix': 'Move sensitive data to environment variables:\n' + \
                          'import os\n' + \
                          'api_key = os.environ.get("API_KEY")'
                })

        # Check for security misconfigurations
        for line_number, line in enumerate(lines):
            if any(re.search(pattern, line, re.I) for pattern in self.patterns['insecure_configs']):
                vulnerabilities.append({
                    'type': 'Security Misconfiguration',
                    'risk_level': 'High',
                    'description': 'Potential security misconfiguration detected.',
                    'location': f'Line {line_number + 1}',
                    'fix': 'Ensure proper security configurations in production:\n' + \
                          'DEBUG = False\n' + \
                          'ALLOWED_HOSTS = ["example.com"]\n' + \
                          'CORS_ORIGIN_WHITELIST = ["https://trusted-site.com"]'
                })

        return vulnerabilities

    def analyze_url(self, url: str) -> List[Dict]:
        """Analyze a URL for potential vulnerabilities."""
        if not validators.url(url):
            return [{'type': 'Invalid URL', 'risk_level': 'Low', 
                    'description': 'The provided URL is not valid.'}]

        vulnerabilities = []
        try:
            response = requests.get(url, timeout=10, verify=True)
            headers = response.headers

            # Check for missing security headers
            security_headers = {
                'Strict-Transport-Security': 'Missing HSTS header',
                'X-Content-Type-Options': 'Missing X-Content-Type-Options header',
                'X-Frame-Options': 'Missing X-Frame-Options header',
                'Content-Security-Policy': 'Missing Content Security Policy'
            }

            for header, message in security_headers.items():
                if header not in headers:
                    vulnerabilities.append({
                        'type': 'Missing Security Headers',
                        'risk_level': 'Medium',
                        'description': message,
                        'fix': f'Add the {header} header to your server responses'
                    })

            # Check for SSL/TLS configuration
            if url.startswith('http://'):
                vulnerabilities.append({
                    'type': 'Insecure Protocol',
                    'risk_level': 'High',
                    'description': 'Website is using HTTP instead of HTTPS',
                    'fix': 'Implement HTTPS using a valid SSL/TLS certificate'
                })

        except requests.exceptions.SSLError:
            vulnerabilities.append({
                'type': 'SSL/TLS Error',
                'risk_level': 'Critical',
                'description': 'SSL/TLS certificate validation failed',
                'fix': 'Ensure a valid SSL certificate is properly installed'
            })
        except requests.exceptions.RequestException as e:
            vulnerabilities.append({
                'type': 'Connection Error',
                'risk_level': 'Low',
                'description': f'Error connecting to URL: {str(e)}'
            })

        return vulnerabilities

    def analyze_logs(self, logs: str) -> List[Dict]:
        """Analyze logs for vulnerabilities and return a list of findings."""
        vulnerabilities = []
        # Example detection pattern for directory traversal
        pattern = r'(?i)\.\..*?\.\..*?'
        matches = re.finditer(pattern, logs)
        for match in matches:
            vulnerabilities.append({
                'type': 'Directory Traversal',
                'risk_level': 'High',
                'description': 'Suspicious pattern detected in logs indicating potential directory traversal attack.',
                'fix': 'Implement input validation and WAF rules',
                'location': f"Line {logs.count('\n', 0, match.start()) + 1}: {match.group()}"
            })
        return vulnerabilities

    def print_results(self, vulnerabilities: List[Dict]):
        """Print vulnerability scan results in a formatted way."""
        if not vulnerabilities:
            st.success("✅ No vulnerabilities detected!")
            return

        # Remove duplicates
        unique_vulnerabilities = []
        seen_types = set()
        for vuln in vulnerabilities:
            if vuln['type'] not in seen_types:
                unique_vulnerabilities.append(vuln)
                seen_types.add(vuln['type'])

        # Display summary
        total_vulns = len(unique_vulnerabilities)
        critical = sum(1 for v in unique_vulnerabilities if v['risk_level'] == 'Critical')
        high = sum(1 for v in unique_vulnerabilities if v['risk_level'] == 'High')
        medium = sum(1 for v in unique_vulnerabilities if v['risk_level'] == 'Medium')
        low = sum(1 for v in unique_vulnerabilities if v['risk_level'] == 'Low')

        st.markdown("""
            <div class='report-container'>
                <h3>Scan Results Summary</h3>
                <div style='display: flex; justify-content: space-around; margin: 20px 0;'>
                    <div style='text-align: center;'>
                        <h2 style='color: #FF4B4B;'>{}</h2>
                        <p>Total Vulnerabilities</p>
                    </div>
                    <div style='text-align: center;'>
                        <h2 style='color: #FF0000;'>{}</h2>
                        <p>Critical</p>
                    </div>
                    <div style='text-align: center;'>
                        <h2 style='color: #FF00FF;'>{}</h2>
                        <p>High</p>
                    </div>
                    <div style='text-align: center;'>
                        <h2 style='color: #FFFF00;'>{}</h2>
                        <p>Medium</p>
                    </div>
                    <div style='text-align: center;'>
                        <h2 style='color: #00FF00;'>{}</h2>
                        <p>Low</p>
                    </div>
                </div>
            </div>
        """.format(total_vulns, critical, high, medium, low), unsafe_allow_html=True)

        # Display each vulnerability with its risk level
        st.markdown("### Detailed Analysis")
        for vuln in unique_vulnerabilities:
            risk_level = vuln['risk_level']
            color = self.risk_colors.get(risk_level, '#CCCCCC')
            
            st.markdown(f"""
            <div class='report-container'>
                <div style='display: flex; justify-content: space-between; align-items: center;'>
                    <h4>{vuln['type']}</h4>
                    <span class='risk-badge' style='background-color: {color}; color: {"black" if risk_level in ["Medium", "Low"] else "white"};'>
                        {risk_level}
                    </span>
                </div>
                <div style='margin-top: 15px;'>
                    <p><strong>Description:</strong><br>{vuln['description']}</p>
                    <p><strong>Location:</strong><br>{vuln.get('location', 'Not specified')}</p>
                    {f"<p><strong>Recommended Fix:</strong><br><pre style='background-color: #f8f9fa; padding: 10px; border-radius: 5px;'>{vuln['fix']}</pre></p>" if 'fix' in vuln else ""}
                </div>
            </div>
            """, unsafe_allow_html=True)
        
        # Download buttons container
        st.markdown("""
            <div class='report-container'>
                <h4>Download Reports</h4>
                <p>Export the vulnerability analysis in your preferred format:</p>
            </div>
        """, unsafe_allow_html=True)
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            # Generate HTML report
            html_report = self.generate_html_report(unique_vulnerabilities)
            st.download_button(
                label="📄 Download HTML Report",
                data=html_report,
                file_name=f"vulnerability_report_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.html",
                mime="text/html"
            )
        
        with col2:
            # Generate CSV report
            csv_report = self.generate_csv_report(unique_vulnerabilities)
            st.download_button(
                label="📊 Download CSV Report",
                data=csv_report,
                file_name=f"vulnerability_report_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                mime="text/csv"
            )
            
        with col3:
            # Generate bug report
            bug_report = self.generate_bug_report(unique_vulnerabilities)
            st.download_button(
                label="🐛 Download Bug Report",
                data=bug_report,
                file_name=f"bug_report_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.md",
                mime="text/markdown"
            )

    def generate_html_report(self, vulnerabilities: List[Dict]) -> str:
        """Generate an HTML report of the vulnerabilities."""
        current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>SHASTRA - Security Vulnerability Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                h1, h2 {{ color: #333; }}
                .risk-scale {{ display: flex; margin: 20px 0; }}
                .risk-item {{ padding: 10px; margin-right: 10px; border-radius: 5px; }}
                .critical {{ background-color: #FF0000; color: white; }}
                .high {{ background-color: #FF00FF; color: white; }}
                .medium {{ background-color: #FFFF00; color: black; }}
                .low {{ background-color: #00FF00; color: black; }}
                .vulnerability {{ border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px; }}
                .risk-label {{ display: inline-block; padding: 5px; border-radius: 3px; margin-bottom: 10px; }}
                pre {{ background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }}
            </style>
        </head>
        <body>
            <h1>SHASTRA - Security Vulnerability Report</h1>
            <p>Generated on: {current_time}</p>
            
            <h2>Risk Scale</h2>
            <div class="risk-scale">
                <div class="risk-item critical">Critical</div>
                <div class="risk-item high">High</div>
                <div class="risk-item medium">Medium</div>
                <div class="risk-item low">Low</div>
            </div>
            
            <h2>Detected Vulnerabilities</h2>
        """
        
        for vuln in vulnerabilities:
            risk_level = vuln['risk_level'].lower()
            html += f"""
            <div class="vulnerability">
                <div class="risk-label {risk_level}" style="background-color: {self.risk_colors[vuln['risk_level']]}; color: {'black' if risk_level in ['medium', 'low'] else 'white'};">
                    {vuln['risk_level']}
                </div>
                <h3>{vuln['type']}</h3>
                <p><strong>Description:</strong> {vuln['description']}</p>
            """
            
            if 'fix' in vuln:
                html += f"""
                <p><strong>Recommended Fix:</strong></p>
                <pre>{vuln['fix']}</pre>
                """
            
            if 'location' in vuln:
                html += f"""
                <p><strong>Location:</strong> {vuln['location']}</p>
                """
            
            html += "</div>"
        
        html += """
        </body>
        </html>
        """
        
        return html
    
    def generate_csv_report(self, vulnerabilities: List[Dict]) -> str:
        """Generate a CSV report of the vulnerabilities."""
        output = io.StringIO()
        writer = csv.writer(output, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
        
        # Write header with clear column names
        writer.writerow([
            'Risk Level',
            'Vulnerability Type',
            'Description',
            'Recommended Fix',
            'Location'
        ])
        
        # Write vulnerabilities with proper formatting
        for vuln in vulnerabilities:
            writer.writerow([
                vuln['risk_level'].upper(),
                vuln['type'],
                vuln['description'].replace('\n', ' '),  # Remove line breaks in description
                vuln.get('fix', '').replace('\n', ' '),   # Remove line breaks in fix
                vuln.get('location', '')                  # Add location if available
            ])
        
        return output.getvalue()

    def generate_bug_report(self, vulnerabilities: List[Dict]) -> str:
        """Generate a bug report from the detected vulnerabilities."""
        report = "# Bug Report\n\n"
        for vuln in vulnerabilities:
            report += f"## {vuln['type']}\n"
            report += f"**Risk Level:** {vuln['risk_level']}\n"
            report += f"**Description:** {vuln['description']}\n"
            report += f"**Recommended Fix:** {vuln.get('fix', '')}\n"
            report += f"**Location:** {vuln.get('location', '')}\n\n"
        return report

# Create FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request models
class CodeScanRequest(BaseModel):
    code: str

class URLScanRequest(BaseModel):
    url: str

class LogScanRequest(BaseModel):
    logs: str

# Create scanner instance
scanner = SecurityScanner()

@app.post("/api/scan/code")
async def scan_code(request: CodeScanRequest):
    """Analyze source code for security vulnerabilities"""
    try:
        return scanner.analyze_code(request.code)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/scan/url")
async def scan_url(request: URLScanRequest):
    """Analyze URL for security vulnerabilities"""
    try:
        return scanner.analyze_url(request.url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/scan/logs")
async def scan_logs(request: LogScanRequest):
    """Analyze logs for security vulnerabilities"""
    try:
        return scanner.analyze_logs(request.logs)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def main():
    # Set page configuration
    st.set_page_config(
        page_title="SHASTRA - Security Vulnerability Scanner",
        page_icon="🛡️",
        layout="wide"
    )

    # Custom CSS for dark theme and animations
    st.markdown("""
        <style>
        body {
            background-color: #1E1E1E;
            color: #FFFFFF;
        }
        .stButton>button {
            transition: background-color 0.3s ease;
        }
        .stButton>button:hover {
            background-color: #FF4B4B;
        }
        .report-container {
            background-color: #2E2E2E;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.5);
            margin: 10px 0;
            animation: fadeIn 0.5s;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        </style>
    """, unsafe_allow_html=True)

    # Header with logo and title
    col1, col2 = st.columns([1, 4])
    with col1:
        st.markdown("# 🛡️")
    with col2:
        st.title("SHASTRA - Security Vulnerability Scanner")
    
    st.markdown("---")

    # Introduction
    st.markdown("""
        <div class='report-container'>
            <h4>Welcome to SHASTRA - AI-Powered Security Scanner</h4>
            <p>Detect and analyze potential security vulnerabilities in your:</p>
            <ul>
                <li>Source Code</li>
                <li>URLs and Endpoints</li>
                <li>Server Logs</li>
            </ul>
        </div>
    """, unsafe_allow_html=True)

    # Create tabs for different analysis methods
    tab1, tab2, tab3 = st.tabs(["📝 Code Analysis", "🌐 URL Analysis", "📋 Log Analysis"])
    
    with tab1:
        st.markdown("### Analyze Source Code")
        st.markdown("Paste your code or upload a file for security analysis.")
        code_input = st.text_area("", height=200, placeholder="Paste your code here...")
        col1, col2 = st.columns([1, 1])
        with col1:
            code_file = st.file_uploader("Or upload a file", type=['py', 'js', 'php', 'java', 'html', 'css'])
        with col2:
            if code_input or code_file:
                if st.button("🔍 Analyze Code", key="analyze_code"):
                    with st.spinner("Analyzing code for vulnerabilities..."):
                        if code_file:
                            code_input = code_file.getvalue().decode()
                        vulnerabilities = scanner.analyze_code(code_input)
                        scanner.print_results(vulnerabilities)

    with tab2:
        st.markdown("### Analyze URL")
        st.markdown("Enter a URL to check for security vulnerabilities.")
        url_input = st.text_input("", placeholder="https://example.com")
        if url_input:
            if st.button("🔍 Analyze URL", key="analyze_url"):
                with st.spinner("Analyzing URL for vulnerabilities..."):
                    vulnerabilities = scanner.analyze_url(url_input)
                    scanner.print_results(vulnerabilities)

    with tab3:
        st.markdown("### Analyze Logs")
        st.markdown("Paste your server logs for security analysis.")
        logs_input = st.text_area("", height=200, placeholder="Paste your logs here...")
        col1, col2 = st.columns([1, 1])
        with col1:
            logs_file = st.file_uploader("Or upload a log file", type=['log', 'txt'])
        with col2:
            if logs_input or logs_file:
                if st.button("🔍 Analyze Logs", key="analyze_logs"):
                    with st.spinner("Analyzing logs for vulnerabilities..."):
                        if logs_file:
                            logs_input = logs_file.getvalue().decode()
                        vulnerabilities = scanner.analyze_logs(logs_input)
                        scanner.print_results(vulnerabilities)

    # Footer
    st.markdown("---")
    st.markdown("""
        <div style='text-align: center; color: #666;'>
            <p>🛡️ Powered by AI | Built with Streamlit | SHASTRA Security Scanner</p>
        </div>
    """, unsafe_allow_html=True)

if __name__ == '__main__':
    uvicorn.run(app, host="0.0.0.0", port=8000)
