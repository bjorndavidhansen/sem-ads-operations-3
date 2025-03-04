sequenceDiagram  
    actor User  
    participant UI as User Interface  
    participant IP as Intent Parser  
    participant LLM as LLM Service  
    participant OF as Operation Framework  
    participant VE as Validation Engine  
      
    Note over User,VE: Intent-Driven Operation Flow  
      
    User-\>\>UI: Enter natural language request  
    Note right of User: "Clone my exact match campaigns to broad match"  
      
    UI-\>\>IP: processUserIntent(text)  
      
    IP-\>\>LLM: analyzeIntent(text, context)  
    Note right of IP: Include user context and available operations  
      
    LLM-\>\>LLM: Process text with context  
      
    LLM--\>\>IP: intentAnalysis  
    Note right of LLM: {operation: "campaignClone", confidence: 0.92, params: {...}}  
      
    alt Confidence \< Threshold  
        IP-\>\>UI: requestClarification(ambiguities)  
        UI-\>\>User: Display clarification request  
        User-\>\>UI: Provide clarification  
        UI-\>\>IP: processUserIntent(clarification)  
        IP-\>\>LLM: analyzeIntent(clarified\_text, context)  
        LLM--\>\>IP: updatedIntentAnalysis  
    end  
      
    IP-\>\>IP: extractOperationParameters()  
    Note right of IP: Map intent to specific operation parameters  
      
    IP--\>\>OF: configureOperation(params)  
    Note right of IP: {operationType: "campaignClone", sourceMatchType: "EXACT", targetMatchType: "BROAD", namingPattern: {...}}  
      
    OF-\>\>VE: validateConfiguration(config)  
    VE--\>\>OF: validationResult  
      
    alt Invalid Configuration  
        OF-\>\>IP: requestParameterRefinement(issues)  
        IP-\>\>UI: displayConfigurationIssues(issues)  
        UI-\>\>User: Show configuration issues  
        User-\>\>UI: Adjust configuration  
        UI-\>\>IP: updateParameters(adjustments)  
        IP-\>\>OF: updateConfiguration(params)  
        OF-\>\>VE: validateConfiguration(config)  
        VE--\>\>OF: validationResult  
    end  
      
    OF--\>\>UI: displayOperationPreview(config)  
    UI-\>\>User: Show operation preview  
      
    User-\>\>UI: Confirm operation  
    UI-\>\>OF: executeOperation(config)  
      
    Note over User,VE: Operation proceeds to execution phase