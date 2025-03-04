flowchart TD  
    %% Define main components with clear colors  
    UI\[User Interface\]  
    OF\[Operation Framework\]  
    IP\[Intent Parser\]  
    VE\[Validation Engine\]  
    API\[API Client\]  
    DM\[Data Manager\]  
      
    %% External systems  
    GAPI\[Google Ads API\]  
    LLM\[LLM Service\]  
      
    %% Group related components  
    subgraph Core\["Core Application Components"\]  
        UI  
        OF  
        VE  
        DM  
    end  
      
    subgraph Integration\["Integration Layer"\]  
        IP  
        API  
    end  
      
    subgraph External\["External Services"\]  
        GAPI  
        LLM  
    end  
      
    %% Authentication Flow  
    UI \--\>|1. Authenticate| API  
    API \--\>|2. Auth URL| UI  
    UI \--\>|3. Auth Code| API  
    API \--\>|4. Store Tokens| DM  
      
    %% Account & Campaign Management  
    UI \--\>|5. Load Accounts| API  
    API \--\>|6. Account List| UI  
    UI \--\>|7. Select Account| OF  
    OF \--\>|8. Fetch Campaigns| API  
    API \--\>|9. Campaign Data| OF  
    OF \--\>|10. Display Campaigns| UI  
      
    %% Intent Processing Path  
    UI \--\>|11a. Process Intent| IP  
    IP \--\>|12a. Analyze Text| LLM  
    LLM \--\>|13a. Intent Analysis| IP  
    IP \--\>|14a. Operation Config| OF  
    OF \--\>|15a. Show Config| UI  
      
    %% Direct Configuration Path  
    UI \--\>|11b. Direct Config| OF  
      
    %% Operation Execution  
    UI \--\>|16. Execute| OF  
    OF \--\>|17. Validate| VE  
    VE \--\>|18. Validation Result| OF  
    OF \--\>|19. Create Restore Point| DM  
    DM \--\>|20. Confirm| OF  
    OF \--\>|21. Execute Operation| API  
    API \--\>|22. API Request| GAPI  
    GAPI \--\>|23. API Response| API  
    API \--\>|24. Process Result| OF  
    OF \--\>|25. Save History| DM  
    OF \--\>|26. Show Result| UI  
      
    %% Error Path  
    API \--\>|E1. Error| OF  
    OF \--\>|E2. Get Restore Point| DM  
    DM \--\>|E3. Restore Data| OF  
    OF \--\>|E4. Execute Rollback| API  
    OF \--\>|E5. Error Result| UI

    %% Styling  
    classDef ui fill:\#2D72B8,color:\#fff,stroke:\#fff  
    classDef framework fill:\#2D72B8,color:\#fff,stroke:\#fff  
    classDef integration fill:\#4A90E2,color:\#fff,stroke:\#fff  
    classDef external fill:\#0A3D62,color:\#fff,stroke:\#fff  
    classDef data fill:\#2D72B8,color:\#fff,stroke:\#fff  
      
    class UI ui  
    class OF,VE framework  
    class IP,API integration  
    class GAPI,LLM external  
    class DM data  
      
    %% Group styling  
    classDef coreStyle fill:none,stroke:\#999,stroke-width:1px  
    classDef integrationStyle fill:none,stroke:\#999,stroke-width:1px  
    classDef externalStyle fill:none,stroke:\#999,stroke-width:1px  
      
    class Core coreStyle  
    class Integration integrationStyle  
    class External externalStyle