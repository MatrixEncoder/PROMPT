# Security Vulnerability Scanner

An AI-powered security tool that helps detect potential vulnerabilities in web applications based on OWASP Top 10 security risks.

## Features

- Code Analysis: Detects common vulnerabilities like SQL Injection, XSS, and exposed secrets
- URL Analysis: Checks for security headers, SSL/TLS configuration, and other web security issues
- Log Analysis: Identifies potential attack patterns and suspicious activities in request logs

## Installation

1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

2. Run the scanner:
```bash
python security_scanner.py
```

## Usage

The scanner provides three main functions:

1. **Code Analysis**
   - Detects SQL Injection vulnerabilities
   - Identifies potential XSS risks
   - Finds exposed secrets and credentials
   - Checks for security misconfigurations

2. **URL Analysis**
   - Validates SSL/TLS configuration
   - Checks for security headers
   - Identifies insecure protocols

3. **Log Analysis**
   - Detects potential brute force attempts
   - Identifies suspicious patterns
   - Monitors for injection attempts

## Example Usage

1. To analyze code:
   - Select option 1
   - Paste your code snippet
   - Review the security analysis results

2. To analyze a URL:
   - Select option 2
   - Enter the URL
   - Review the security headers and configuration analysis

3. To analyze logs:
   - Select option 3
   - Paste your log entries
   - Review potential security threats

## Output Format

For each detected vulnerability, the scanner provides:
- Risk Level (Critical, High, Medium, Low)
- Vulnerability Type
- Description of the issue
- Recommended fix with code examples

## Security Note

This tool is meant for educational and testing purposes. Always follow responsible security testing practices and obtain proper authorization before scanning any systems or applications.
"# Prompt-Hackathon" 
"# PROMPT" 
