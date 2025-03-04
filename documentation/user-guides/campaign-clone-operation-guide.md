# Campaign Clone Operation - User Guide

## Overview

The Campaign Clone Operation allows you to efficiently create broad match variants of your exact match campaigns. This guide will walk you through the process of using this feature, including campaign selection, configuration, validation, and recovery options.

## When to Use Campaign Clone

Use this feature when you want to:

- Expand your search coverage by creating broad match variants
- Test different match types with the same keywords
- Create systematic campaign structure with both exact and broad match campaigns
- Implement proper search term routing between match types

## Step-by-Step Guide

### 1. Accessing Campaign Clone

1. Log in to the SEM Ads Operations Tool
2. Navigate to "Campaigns" in the main navigation
3. Select "Clone Operations" from the dropdown menu

### 2. Selecting Campaigns

1. Use the filtering options to find your exact match campaigns:
   - Filter by name (e.g., "Exact" or specific campaign naming pattern)
   - Filter by match type (select "Exact Match" from the dropdown)
   - Filter by status (typically "Enabled" campaigns)

2. Select campaigns to clone:
   - Use checkboxes next to campaign names
   - Use "Select All" for bulk selection
   - Review the selection summary at the bottom of the screen

### 3. Configuring Clone Settings

1. Set naming convention:
   - Use the template builder to create names for cloned campaigns
   - Available variables: `{original}`, `{date}`, `{matchtype}`
   - Example: `{original} - Broad` will create "Campaign Name - Broad"

2. Choose match type conversion:
   - Select "Broad Match" for the cloned campaigns
   - This will convert all exact match keywords to broad match in the clones

3. Configure negative keyword options:
   - Enable "Add exact match as negatives" to prevent search term overlap
   - This adds all exact match keywords as negative exact keywords in the broad campaign

### 4. Validation and Preview

1. Review the validation summary:
   - Number of campaigns to be cloned
   - Estimated number of keywords affected
   - Potential naming conflicts
   - API usage estimation

2. Address any warnings:
   - Yellow warnings: Recommended to fix but operation can proceed
   - Red warnings: Must be fixed before proceeding

3. View the detailed preview:
   - Sample of campaigns to be created
   - Keyword match type changes
   - Negative keyword additions

### 5. Executing the Operation

1. Click "Execute Clone Operation" to begin
2. The progress tracker will display:
   - Overall completion percentage
   - Campaigns processed/remaining
   - Estimated time remaining
   - Current API utilization

3. You can choose to:
   - Wait for completion on the current screen
   - Continue working elsewhere (progress will continue in background)
   - View in the Operations Dashboard

### 6. Reviewing Results

1. Once complete, a summary will show:
   - Success rate (% of campaigns successfully cloned)
   - Number of campaigns created
   - Number of keywords converted
   - Number of negative keywords added

2. You can either:
   - View created campaigns directly
   - Go to the Operations Dashboard for detailed logs

### 7. Using the Operations Dashboard

1. Access the dashboard from:
   - Header navigation menu
   - Post-operation summary screen
   - Direct URL: `/operations`

2. The dashboard shows:
   - All operations with filtering by type/status
   - Success/failure metrics
   - Detailed operation logs

3. For each operation, you can:
   - View detailed logs and results
   - Retry failed operations
   - View validation issues
   - Apply automated fixes

## Recovering from Failures

If an operation fails or partially completes:

1. Go to the Operations Dashboard
2. Find the failed operation
3. Click on it to view details
4. View the validation panel for recommended fixes
5. Use "Auto-Fix" for common issues or "Retry Operation" to manually retry

### Common Issues and Fixes

| Issue | Description | Resolution |
|-------|-------------|------------|
| Rate Limit Exceeded | API rate limits were reached during processing | Use auto-fix to retry with reduced chunk size |
| Token Expired | Authentication token expired during long operations | Retry operation (new token will be used automatically) |
| Invalid Campaign Structure | Source campaigns had unexpected structure | Review campaign details and retry with adjusted settings |

## Best Practices

1. **Chunk Size Management**:
   - For small accounts (< 10 campaigns): Default settings work well
   - For medium accounts (10-30 campaigns): Consider setting chunk size to 5
   - For large accounts (30+ campaigns): Consider setting chunk size to 3

2. **Naming Conventions**:
   - Use clear match type indicators in names
   - Maintain consistent naming patterns across account
   - Avoid special characters that may cause API issues

3. **Operation Timing**:
   - Run large operations during off-peak hours
   - Allow sufficient time for large operations to complete
   - Consider splitting very large operations (100+ campaigns)

4. **Validation Review**:
   - Always review validation warnings before proceeding
   - Address all red warnings
   - Consider addressing yellow warnings for optimal results

## Advanced Options

### Custom Chunk Size

For very large accounts or when experiencing rate issues:

1. Access advanced settings in the clone configuration
2. Adjust "Operation Chunk Size" to a lower value (1-5)
3. This will process fewer campaigns simultaneously but is more reliable

### Custom Negative Keywords

To customize the negative keyword implementation:

1. Enable "Advanced Negative Keyword Options" in clone settings
2. Choose between:
   - All exact keywords as negatives (default)
   - Only converting keywords as negatives
   - Custom negative keyword list

## Troubleshooting

| Symptom | Possible Cause | Solution |
|---------|----------------|----------|
| Operation stuck at X% | Rate limiting or temporary API issue | Wait 5 minutes, then check Operations Dashboard |
| Failed with "Authentication Error" | OAuth token issue | Retry operation |
| Partial completion | Issues with specific campaigns | Use Operations Dashboard to retry only failed campaigns |
| No campaigns created | Configuration issue or permissions problem | Check validation preview for warnings |

---

For additional support, contact the SEM Ads Operations team.
