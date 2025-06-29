# Release Notes Template

## How to Create Manual Release Notes

For major releases or when you want custom release notes, create a file named `RELEASE_NOTES_v{version}.md` in the project root.

### Example: For version v1.2.0, create `RELEASE_NOTES_v1.2.0.md`

```markdown
## 🎲 Gloomhaven Digital Game Engine v1.2.0

### 🚀 Major Features
- ✨ **New Combat System** - Complete attack resolution with conditions
- 🎯 **Monster AI** - Intelligent focus and movement algorithms  
- 🎴 **Character Cards** - Full ability card implementation
- 🗺️ **Scenario Editor** - Create custom scenarios (beta)

### 🐛 Bug Fixes
- Fixed hex pathfinding edge cases
- Resolved character positioning issues
- Improved accessibility keyboard navigation
- Performance optimizations for large scenarios

### 💔 Breaking Changes
- API changes in `GameState` interface (see migration guide)
- Updated save file format (automatic migration included)

### 🔧 Technical Improvements
- Upgraded to Next.js 16
- Enhanced TypeScript strict mode compliance
- Improved test coverage to 98%
- Added Docker deployment support

### 📚 Documentation
- Updated API documentation
- Added developer setup guide
- Improved troubleshooting section

### 🙏 Contributors
Special thanks to:
- @contributor1 for monster AI implementation
- @contributor2 for accessibility improvements
- @contributor3 for performance optimizations

### 🔄 Migration Guide
If upgrading from v1.1.x:
1. Update your dependencies: `npm install`
2. Run migration script: `npm run migrate`
3. Update any custom TypeScript types (see BREAKING_CHANGES.md)

### 🐛 Known Issues
- Safari performance on large scenarios (fix in v1.2.1)
- Edge case with 5-player difficulty scaling (investigating)

### 📥 Installation
Download the assets below and extract to your web server:
- `gloomhaven-engine-v1.2.0.tar.gz` - Production build
```

## Automatic vs Manual Release Notes

### Automatic (Default)
- ✅ **Zero maintenance** - No pipeline updates needed
- ✅ **Always works** - Generates from git commits
- ❌ **Basic formatting** - Just lists commit messages
- ❌ **No context** - Doesn't explain impact or breaking changes

### Manual (Optional)
- ✅ **Rich content** - Feature highlights, breaking changes, migration guides
- ✅ **Marketing friendly** - Professional release announcements
- ✅ **User focused** - Explains what changed from user perspective
- ❌ **Requires work** - Someone needs to write them

## Best Practices

### Commit Messages (for automatic notes)
Use conventional commit format for better automatic release notes:
```
feat: add monster AI focus algorithm
fix: resolve hex pathfinding edge case
docs: update API documentation
perf: optimize SVG rendering performance
BREAKING CHANGE: GameState interface updated
```

### Manual Release Notes (for major versions)
- Focus on user-facing changes
- Include migration guides for breaking changes
- Highlight new features with examples
- Mention known issues and workarounds
- Thank contributors

### When to Use Manual Notes
- Major version releases (v1.0.0, v2.0.0)
- Significant feature additions
- Breaking changes that need explanation
- Community-facing releases
- When you want marketing-quality announcements

### File Naming Convention
- Format: `RELEASE_NOTES_v{version}.md`
- Examples:
  - `RELEASE_NOTES_v1.0.0.md`
  - `RELEASE_NOTES_v2.1.0.md`
  - `RELEASE_NOTES_v1.0.0-beta.1.md`

## Pipeline Behavior

1. **Check for manual notes** - Looks for `RELEASE_NOTES_v{tag}.md` file
2. **Use manual if exists** - Copies the manual file as release notes
3. **Generate automatic otherwise** - Creates notes from git commits
4. **Add build info** - Appends commit hash, build date, etc.
5. **Create GitHub Release** - Publishes with the generated notes

This gives you the best of both worlds: zero-maintenance automatic releases for regular development, and rich manual releases when needed for major announcements!