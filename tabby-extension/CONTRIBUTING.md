# Contributing to TabSense AI

We welcome contributions to TabSense AI! This document provides guidelines for contributing to the project.

## 🤝 How to Contribute

### Reporting Issues
1. Check existing issues to avoid duplicates
2. Use the issue template when available
3. Provide detailed reproduction steps
4. Include browser version and extension version
5. Add screenshots or error logs when helpful

### Suggesting Features
1. Check if the feature already exists or is planned
2. Describe the use case and expected behavior
3. Consider if it fits the project's scope and vision
4. Discuss implementation approach if you have ideas

### Contributing Code

#### Prerequisites
- Chrome Canary or Chrome Dev (for AI features)
- Git for version control
- Basic knowledge of JavaScript, HTML, CSS
- Understanding of Chrome Extension APIs

#### Development Setup
1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/Tabby.git
   cd Tabby/tabby-extension
   ```

2. **Load extension in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `tabby-extension` folder

3. **Make changes and test**
   - Edit code in your preferred editor
   - Reload extension in Chrome after changes
   - Test functionality thoroughly

#### Code Standards
- **JavaScript**: Use modern ES6+ syntax
- **Formatting**: Consistent indentation (2 spaces)
- **Comments**: Document complex logic and AI integration points
- **Error Handling**: Always include try-catch for async operations
- **Performance**: Optimize for tab-heavy usage scenarios

#### AI Integration Guidelines
- Always check API availability before use
- Implement fallback algorithms for when AI APIs are unavailable
- Use Chrome's built-in AI APIs only (no external services)
- Handle errors gracefully and provide meaningful user feedback

#### Pull Request Process
1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow existing code patterns
   - Add comments for complex logic
   - Test thoroughly

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

4. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   - Create pull request on GitHub
   - Fill out the PR template
   - Link any related issues

## 📋 Commit Message Format

Use conventional commits for better changelog generation:

- `feat:` new features
- `fix:` bug fixes
- `docs:` documentation changes
- `style:` formatting changes
- `refactor:` code refactoring
- `test:` adding tests
- `chore:` maintenance tasks

Examples:
- `feat: add voice input for chat interface`
- `fix: resolve tab search case sensitivity issue`
- `docs: update installation instructions`

## 🧪 Testing Guidelines

### Before Submitting
1. **Manual Testing**
   - Test in both Chrome stable and Chrome Canary
   - Verify functionality with and without AI APIs
   - Test with many tabs open (50+)
   - Check all UI interactions

2. **AI Feature Testing**
   - Use `test-ai.html` to verify API availability
   - Test fallback algorithms when AI unavailable
   - Verify error handling for API failures

3. **Performance Testing**
   - Check memory usage with large tab sets
   - Verify extension doesn't slow browser startup
   - Test responsiveness of UI interactions

### Test Cases to Cover
- [ ] Extension loads properly
- [ ] Tab search works with various queries
- [ ] Tab organization creates logical groups
- [ ] Chat interface responds appropriately
- [ ] Theme switching works correctly
- [ ] Voice input functions (if supported)
- [ ] AI features work when APIs available
- [ ] Fallback algorithms work when AI unavailable
- [ ] Settings persist across browser restarts

## 🏗️ Architecture Guidelines

### File Organization
- `background.js`: Core logic, AI integration, tab management
- `popup/`: User interface components
- `assets/`: Icons, images, static resources
- `test-ai.html`: AI API testing utilities

### Adding New Features
1. **Plan the feature**
   - Consider impact on existing functionality
   - Design for both AI and non-AI scenarios
   - Think about performance implications

2. **Implement incrementally**
   - Start with basic functionality
   - Add AI enhancement if applicable
   - Implement fallback behavior

3. **Update documentation**
   - Add feature to README
   - Update relevant comments
   - Consider adding to test page

## 🔐 Security Considerations

- Never include API keys or sensitive data in code
- Use Chrome's storage API for user data
- Minimize permissions in manifest.json
- Validate all user inputs
- Handle errors without exposing internal details

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For general questions and ideas
- **Code Review**: Request reviews on pull requests

## 🎯 Project Vision

TabSense AI aims to be:
- **Intelligent**: Leveraging AI where available, smart algorithms everywhere
- **Privacy-First**: All processing happens locally
- **User-Friendly**: Intuitive interface with progressive disclosure
- **Performance-Optimized**: Efficient even with hundreds of tabs
- **Future-Ready**: Designed to evolve with Chrome's AI capabilities

Thank you for contributing to TabSense AI! 🚀