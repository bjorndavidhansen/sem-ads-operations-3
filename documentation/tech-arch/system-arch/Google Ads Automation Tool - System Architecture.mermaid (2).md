flowchart TD  
    subgraph "User Interface Layer"  
        UI\[Desktop Application UI\]  
        UI \--\> Auth\[Authentication Module\]  
        UI \--\> Dashboard\[Dashboard\]  
        UI \--\> OpSelect\[Operation Selection\]  
        UI \--\> Config\[Operation Configuration\]  
        UI \--\> Results\[Results Visualization\]  
        UI \--\> History\[History & Rollback\]  
        UI \--\> Settings\[Settings\]  
    end

    subgraph "Operation Framework Layer"  
        OpFramework\[Operation Framework\]  
        OpSelect \--\> OpFramework  
        Config \--\> OpFramework

        subgraph "Operation Modules"  
            CampaignClone\[Campaign Clone Operation\]  
            SearchTerms\[Search Term Analysis\]  
            CustomOps\[Custom Operations\]  
        end

        OpFramework \--\> CampaignClone  
        OpFramework \--\> SearchTerms  
        OpFramework \--\> CustomOps  
    end

    subgraph "Intent Processing Layer"  
        Intent\[Intent Parser\]  
        LLM\[LLM Integration\]  
          
        UI \--\> Intent  
        Intent \--\> LLM  
        LLM \--\> OpFramework  
    end

    subgraph "API Integration Layer"  
        APIClient\[Google Ads API Client\]  
        RateLimit\[Rate Limiting Manager\]  
        ErrorHandler\[Error Handler\]  
          
        CampaignClone \--\> APIClient  
        SearchTerms \--\> APIClient  
        CustomOps \--\> APIClient  
          
        APIClient \--\> RateLimit  
        APIClient \--\> ErrorHandler  
    end

    subgraph "Data Management Layer"  
        LocalStorage\[(Local Storage)\]  
        Templates\[(Operation Templates)\]  
        History \--\> LocalStorage  
        OpFramework \--\> Templates  
        Results \--\> LocalStorage  
    end

    subgraph "External Services"  
        GoogleAdsAPI\[Google Ads API\]  
        OAuthService\[Google OAuth\]  
        LLMAPI\[LLM API Service\]  
    end

    Auth \--\> OAuthService  
    APIClient \--\> GoogleAdsAPI  
    LLM \--\> LLMAPI

    %% Data Flow  
    GoogleAdsAPI \-- Campaign Data \--\> APIClient  
    OAuthService \-- Auth Tokens \--\> Auth  
    LocalStorage \-- Operation History \--\> History  
    Templates \-- Saved Operations \--\> OpFramework

    %% Background Services  
    ValidationEngine\[Validation Engine\]  
    RollbackManager\[Rollback Manager\]  
      
    OpFramework \--\> ValidationEngine  
    History \--\> RollbackManager  
    RollbackManager \--\> APIClient