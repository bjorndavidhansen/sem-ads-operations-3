flowchart TD  
    Start(\[Start\]) \--\> Auth\[Authentication\]  
    Auth \--\> AccSelect\[Account Selection\]  
    AccSelect \--\> Dashboard\[Main Dashboard\]  
    Dashboard \--\> OperSelect\[Select Operation Type\]  
      
    subgraph Campaign Clone Operation  
        OperSelect \--\> CampSelect\[Campaign Selection\]  
        CampSelect \--\> FilterCamp\[Filter for Exact Match Campaigns\]  
        FilterCamp \--\> SelectCamp\[Select Multiple Campaigns\]  
        SelectCamp \--\> ConfirmSel\[Confirm Selection\]  
          
        ConfirmSel \--\> ConfigOp\[Configure Operation\]  
        ConfigOp \--\> SetNaming\[Set Naming Pattern\\n'Exact' → 'Broad'\]  
        SetNaming \--\> MatchConv\[Configure Match Type Conversion\\nExact → Broad\]  
        MatchConv \--\> NegKeywords\[Configure Negative Keywords\\nAdd exact match as negatives\]  
          
        NegKeywords \--\> Validate\[Validate Operation\]  
        Validate \--\> ValidResult{Valid?}  
        ValidResult \--\>|No| FixIssues\[Fix Issues\]  
        FixIssues \--\> Validate  
          
        ValidResult \--\>|Yes| Preview\[Preview Changes\]  
        Preview \--\> ConfirmExec\[Confirm Execution\]  
          
        ConfirmExec \--\> Execute\[Execute Operation\]  
        Execute \--\> Progress\[Show Progress\\n& Status Updates\]  
        Progress \--\> Complete\[Operation Complete\]  
    end  
      
    Complete \--\> Results\[View Results\]  
    Results \--\> ExportReport\[Export Report\]  
    Results \--\> SaveTemplate\[Save as Template\]  
    Results \--\> NewOperation\[Start New Operation\]  
      
    %% Decision points and alternate flows  
    Validate \--\> CancelOp\[Cancel Operation\]  
    CancelOp \--\> Dashboard  
    Execute \--\> ErrorHandling{Errors?}  
    ErrorHandling \--\>|Yes| HandleErrors\[Handle Errors\]  
    HandleErrors \--\> Retry\[Retry/Skip/Cancel\]  
    Retry \--\> Execute  
    ErrorHandling \--\>|No| Progress