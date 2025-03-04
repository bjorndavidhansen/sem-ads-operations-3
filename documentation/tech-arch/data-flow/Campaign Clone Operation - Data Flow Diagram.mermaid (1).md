flowchart TD  
    %% External Data Sources  
    GoogleAdsAPI\[(Google Ads API)\]  
      
    %% Data Stores  
    LocalCache\[(Local Cache)\]  
    OperationHistory\[(Operation History)\]  
    RestorePoint\[(Restore Point)\]  
      
    %% User Input  
    UserInput\[User Input:\\nSelected Campaigns\\nConfig Parameters\]  
      
    %% Main Data Flows  
    subgraph Data Flow \- Campaign Clone Operation  
        %% Data Fetch  
        FetchCampaigns\[Fetch Selected Campaigns\]  
        CampaignData\[Campaign Data\]  
          
        %% Data Processing  
        CloneCampaigns\[Create Campaign Duplicates\]  
        ModifyNames\[Modify Campaign Names\]  
        ExtractKeywords\[Extract Exact Match Keywords\]  
        ConvertKeywords\[Convert to Broad Match\]  
        CreateNegatives\[Create Negative Keywords\]  
          
        %% Data Validation  
        ValidateChanges{Validate Changes}  
          
        %% Data Output  
        PrepareUpload\[Prepare Data for Upload\]  
        ExecuteChanges\[Execute API Changes\]  
          
        %% Create Logs  
        CreateLogs\[Create Operation Logs\]  
    end  
      
    %% Flow Connections  
    UserInput \--\> FetchCampaigns  
    FetchCampaigns \--\> GoogleAdsAPI  
    GoogleAdsAPI \--\> CampaignData  
    CampaignData \--\> LocalCache  
      
    CampaignData \--\> RestorePoint  
    LocalCache \--\> CloneCampaigns  
      
    CloneCampaigns \--\> ModifyNames  
    ModifyNames \--\> ExtractKeywords  
    ExtractKeywords \--\> ConvertKeywords  
    CampaignData \--\> CreateNegatives  
    ExtractKeywords \--\> CreateNegatives  
    ConvertKeywords \--\> ValidateChanges  
    CreateNegatives \--\> ValidateChanges  
      
    ValidateChanges \--\>|Pass| PrepareUpload  
    ValidateChanges \--\>|Fail| ValidationError\[Validation Error Data\]  
    ValidationError \--\> UserInput  
      
    PrepareUpload \--\> ExecuteChanges  
    ExecuteChanges \--\> GoogleAdsAPI  
    ExecuteChanges \--\> CreateLogs  
    CreateLogs \--\> OperationHistory  
      
    %% Data Structures  
    subgraph "Original Campaign Data Structure"  
        OCampaign\["Campaign {  
            id: string,  
            name: string,  
            status: string,  
            adGroups: AdGroup\[\]  
        }"\]  
          
        OAdGroup\["AdGroup {  
            id: string,  
            name: string,  
            keywords: Keyword\[\]  
        }"\]  
          
        OKeyword\["Keyword {  
            id: string,  
            text: string,  
            matchType: 'EXACT',  
            ...other properties  
        }"\]  
          
        OCampaign \--\> OAdGroup  
        OAdGroup \--\> OKeyword  
    end  
      
    subgraph "Transformed Campaign Data Structure"  
        TCampaign\["Campaign {  
            name: string, // Modified name  
            status: string,  
            adGroups: AdGroup\[\]  
        }"\]  
          
        TAdGroup\["AdGroup {  
            name: string,  
            keywords: Keyword\[\]  
        }"\]  
          
        TKeyword\["Keyword {  
            text: string,  
            matchType: 'BROAD',  
            ...other properties  
        }"\]  
          
        TNegKeyword\["NegativeKeyword {  
            text: string,  
            matchType: 'EXACT'  
        }"\]  
          
        TCampaign \--\> TAdGroup  
        TAdGroup \--\> TKeyword  
        TAdGroup \--\> TNegKeyword  
    end  
      
    %% Error Handling  
    ExecuteChanges \--\>|Error| APIError\[API Error Data\]  
    APIError \--\> RollbackProcess\[Rollback Process\]  
    RollbackProcess \--\> RestorePoint  
    RollbackProcess \--\> GoogleAdsAPI  
      
    %% Rate Limiting  
    RateLimit\[Rate Limit Manager\]  
    ExecuteChanges \--\> RateLimit  
    RateLimit \--\> GoogleAdsAPI