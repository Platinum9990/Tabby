# Security Policy

## Supported Versions

We actively support the following versions of TabSense AI:

| Version | Supported          |
| ------- | ------------------ |
| 0.2.x   | :white_check_mark: |
| 0.1.x   | :x:                |

## Reporting Security Vulnerabilities

We take security seriously. If you discover a security vulnerability in TabSense AI, please follow these steps:

### 🔒 Private Disclosure

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, please:
1. Email security details to the maintainers
2. Include "SECURITY" in the subject line
3. Provide detailed information about the vulnerability
4. Include steps to reproduce if possible

### 📋 Information to Include

When reporting a security issue, please include:

- **Description**: Clear description of the vulnerability
- **Impact**: What could an attacker accomplish?
- **Reproduction**: Step-by-step instructions to reproduce
- **Affected Versions**: Which versions are affected
- **Environment**: Browser version, OS, etc.
- **Suggested Fix**: If you have ideas for resolution

### ⚡ Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 1 week
- **Resolution**: Depends on complexity, typically 2-4 weeks

## Security Considerations

### 🛡️ Extension Security

TabSense AI is designed with security in mind:

**Local Processing Only**:
- No external API calls or data transmission
- All AI processing happens locally via Chrome's built-in APIs
- No user data leaves the browser

**Minimal Permissions**:
- Only requests necessary Chrome extension permissions
- No access to sensitive data outside of tabs
- No network requests to external servers

**Data Privacy**:
- Chat history stored locally only
- Tab metadata kept in browser storage
- No analytics or tracking

### 🔍 Common Security Best Practices

**For Users**:
- Only install from trusted sources
- Review extension permissions before installing
- Keep Chrome updated for latest security patches
- Report suspicious behavior immediately

**For Developers**:
- Follow Chrome extension security guidelines
- Validate all inputs and handle errors gracefully
- Use Content Security Policy (CSP)
- Regular security audits of dependencies

### 🚨 Known Security Considerations

**Chrome AI APIs**:
- Experimental APIs may have unknown security implications
- All AI processing happens locally (no external transmission)
- API availability depends on Chrome security policies

**Extension Permissions**:
- `tabs`: Required for tab management features
- `storage`: For local settings and chat history
- `scripting`: For content extraction (when available)
- `alarms`: For idle tab detection
- `notifications`: For user notifications

### 📊 Security Audit

Last security review: October 2025

**Findings**:
- ✅ No external data transmission
- ✅ Minimal permission set
- ✅ Input validation implemented
- ✅ Error handling prevents information disclosure
- ✅ No known vulnerabilities in dependencies

## Responsible Disclosure

We believe in responsible disclosure and will:

1. **Acknowledge** your report within 48 hours
2. **Investigate** the issue thoroughly
3. **Develop** a fix for confirmed vulnerabilities
4. **Release** security updates promptly
5. **Credit** researchers (with permission) in release notes

## Security Updates

Security updates will be:
- Released as soon as possible after confirmation
- Clearly marked in release notes
- Announced through appropriate channels
- Backported to supported versions when necessary

## Contact

For security-related questions or concerns:
- Create a private GitHub security advisory
- Reference this security policy in communications
- Allow reasonable time for response and resolution

---

**Thank you for helping keep TabSense AI secure!** 🔐