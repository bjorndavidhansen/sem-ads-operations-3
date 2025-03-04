flowchart TD  
    %% Main Application Container  
    AppContainer\[App Container\]  
      
    %% App Screens  
    AuthScreen\[Authentication Screen\]  
    AccountScreen\[Account Selection\]  
    Dashboard\[Dashboard\]  
    OperationScreen\[Operation Screen\]  
    ResultsScreen\[Results Screen\]  
    HistoryScreen\[History Screen\]  
    SettingsScreen\[Settings Screen\]  
      
    %% First Level Component Relations  
    AppContainer \--\> AuthScreen  
    AppContainer \--\> AccountScreen  
    AppContainer \--\> Dashboard  
    AppContainer \--\> OperationScreen  
    AppContainer \--\> ResultsScreen  
    AppContainer \--\> HistoryScreen  
    AppContainer \--\> SettingsScreen  
      
    %% Shared Components  
    subgraph SharedComponents\[Shared UI Components\]  
        Header\[Header Component\]  
        NavSidebar\[Navigation Sidebar\]  
        Footer\[Footer Component\]  
        Notifications\[Notification System\]  
        LoadingIndicators\[Loading Indicators\]  
        ErrorBoundary\[Error Boundary\]  
    end  
      
    AppContainer \--\> SharedComponents  
      
    %% Authentication Components  
    subgraph AuthComponents\[Authentication Components\]  
        LoginForm\[Login Form\]  
        GoogleAuthButton\[Google Auth Button\]  
        AuthStatus\[Auth Status\]  
    end  
      
    AuthScreen \--\> AuthComponents  
      
    %% Account Selection Components  
    subgraph AccountComponents\[Account Selection Components\]  
        AccountList\[Account List\]  
        AccountFilters\[Account Filters\]  
        AccountItem\[Account Item Card\]  
        SelectionSummary\[Selection Summary\]  
    end  
      
    AccountScreen \--\> AccountComponents  
      
    %% Dashboard Components  
    subgraph DashboardComponents\[Dashboard Components\]  
        AccountSummary\[Account Summary Cards\]  
        RecentOperations\[Recent Operations\]  
        QuickActions\[Quick Actions\]  
        SystemStatus\[System Status\]  
    end  
      
    Dashboard \--\> DashboardComponents  
      
    %% Operation Components  
    subgraph OperationComponents\[Operation Components\]  
        OperationTypes\[Operation Types Selector\]  
          
        subgraph CampaignSelectionComponents\[Campaign Selection\]  
            CampaignFilters\[Campaign Filters\]  
            CampaignList\[Campaign List\]  
            CampaignItem\[Campaign Item\]  
            SelectionPanel\[Selection Summary Panel\]  
        end  
          
        subgraph ConfigComponents\[Configuration\]  
            GeneralConfig\[General Configuration\]  
            NamingPatternConfig\[Naming Pattern Config\]  
            MatchTypeConfig\[Match Type Config\]  
            NegativeKeywordConfig\[Negative Keyword Config\]  
            IntentInputField\[Intent Input Field\]  
        end  
          
        subgraph ValidationComponents\[Validation\]  
            ValidationSummary\[Validation Summary\]  
            ValidationDetails\[Validation Details\]  
            IssueList\[Issue List\]  
            ConfirmationPrompt\[Confirmation Prompt\]  
        end  
          
        subgraph ExecutionComponents\[Execution\]  
            ProgressIndicator\[Progress Indicator\]  
            CurrentAction\[Current Action\]  
            ExecutionLog\[Execution Log\]  
            CancelButton\[Cancel Button\]  
        end  
    end  
      
    OperationScreen \--\> OperationComponents  
    OperationComponents \--\> CampaignSelectionComponents  
    OperationComponents \--\> ConfigComponents  
    OperationComponents \--\> ValidationComponents  
    OperationComponents \--\> ExecutionComponents  
      
    %% Results Components  
    subgraph ResultsComponents\[Results Components\]  
        SuccessSummary\[Success Summary\]  
        OperationStats\[Operation Statistics\]  
        ChangesSummary\[Changes Summary\]  
        ActionButtons\[Action Buttons\]  
    end  
      
    ResultsScreen \--\> ResultsComponents  
      
    %% History Components  
    subgraph HistoryComponents\[History Components\]  
        HistoryFilters\[History Filters\]  
        OperationList\[Operation List\]  
        OperationDetails\[Operation Details\]  
        RollbackButton\[Rollback Button\]  
    end  
      
    HistoryScreen \--\> HistoryComponents  
      
    %% Settings Components  
    subgraph SettingsComponents\[Settings Components\]  
        SettingsTabs\[Settings Tabs\]  
        AccountSettings\[Account Settings\]  
        PerformanceSettings\[Performance Settings\]  
        DefaultPreferences\[Default Preferences\]  
        AdvancedSettings\[Advanced Settings\]  
    end  
      
    SettingsScreen \--\> SettingsComponents  
      
    %% Component State Flow  
    OperationComponents \-- "State Flow" \--\> ResultsComponents  
    ResultsComponents \-- "Template/Repeat" \--\> OperationComponents  
    HistoryComponents \-- "Rollback" \--\> OperationComponents  
      
    %% Styling  
    classDef container fill:\#2D72B8,color:\#fff,stroke:\#fff,stroke-width:2px  
    classDef screen fill:\#4A90E2,color:\#fff,stroke:\#fff,stroke-width:2px  
    classDef componentGroup fill:none,color:\#333,stroke:\#999,stroke-width:1px  
    classDef component fill:\#E9EEF4,color:\#333,stroke:\#333,stroke-width:1px  
      
    class AppContainer container  
    class AuthScreen,AccountScreen,Dashboard,OperationScreen,ResultsScreen,HistoryScreen,SettingsScreen screen  
    class SharedComponents,AuthComponents,AccountComponents,DashboardComponents,OperationComponents,CampaignSelectionComponents,ConfigComponents,ValidationComponents,ExecutionComponents,ResultsComponents,HistoryComponents,SettingsComponents componentGroup  
    class Header,NavSidebar,Footer,Notifications,LoadingIndicators,ErrorBoundary,LoginForm,GoogleAuthButton,AuthStatus,AccountList,AccountFilters,AccountItem,SelectionSummary,AccountSummary,RecentOperations,QuickActions,SystemStatus,OperationTypes,CampaignFilters,CampaignList,CampaignItem,SelectionPanel,GeneralConfig,NamingPatternConfig,MatchTypeConfig,NegativeKeywordConfig,IntentInputField,ValidationSummary,ValidationDetails,IssueList,ConfirmationPrompt,ProgressIndicator,CurrentAction,ExecutionLog,CancelButton,SuccessSummary,OperationStats,ChangesSummary,ActionButtons,HistoryFilters,OperationList,OperationDetails,RollbackButton,SettingsTabs,AccountSettings,PerformanceSettings,DefaultPreferences,AdvancedSettings component