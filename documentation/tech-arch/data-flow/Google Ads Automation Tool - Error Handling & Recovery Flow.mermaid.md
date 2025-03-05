flowchart TD  
    %% Main Entry Points for Errors  
    Start(\[Normal Operation Flow\]) \--\> ErrorDetect{Error Detected?}  
      
    %% Error Detection  
    ErrorDetect \--\>|No| ContinueOp(\[Continue Normal Flow\])  
    ErrorDetect \--\>|Yes| ErrorClass{Classify Error}  
      
    %% Error Categories  
    subgraph ErrorCat\[Error Categories\]  
        AuthError\[Authentication Error\]  
        RateLimitError\[Rate Limit Error\]  
        ValidationError\[Validation Error\]  
        APIError\[API Error\]  
        SystemError\[System Error\]  
    end  
      
    %% Error Classification  
    ErrorClass \--\>|Auth Failure| AuthError  
    ErrorClass \--\>|Rate Limit| RateLimitError  
    ErrorClass \--\>|Validation| ValidationError  
    ErrorClass \--\>|API Response| APIError  
    ErrorClass \--\>|System| SystemError  
      
    %% Authentication Error Handling  
    AuthError \--\> AuthErrType{Error Type}  
    AuthErrType \--\>|Token Expired| TokenRefresh\[Refresh Token\]  
    AuthErrType \--\>|Invalid Credentials| ReAuth\[Prompt Re-authentication\]  
    AuthErrType \--\>|Permission Issue| PermissionNotify\[Notify Permission Required\]  
      
    TokenRefresh \--\>|Success| RetryAuth\[Retry Operation\]  
    TokenRefresh \--\>|Failure| ReAuth  
    ReAuth \--\> UserReAuth\[User Re-authenticates\]  
    UserReAuth \--\> RetryAuth  
    PermissionNotify \--\> UserReAuth  
      
    %% Rate Limit Error Handling  
    RateLimitError \--\> GetRateInfo\[Get Rate Limit Info\]  
    GetRateInfo \--\> CalculateBackoff\[Calculate Backoff Time\]  
    CalculateBackoff \--\> QueueOperation\[Queue Operation\]  
    QueueOperation \--\> WaitBackoff\[Wait for Backoff\]  
    WaitBackoff \--\> NotifyUserDelay\[Notify User of Delay\]  
    WaitBackoff \--\> RetryOp1\[Retry After Backoff\]  
      
    %% Validation Error Handling  
    ValidationError \--\> ValidErrType{Validation Type}  
    ValidErrType \--\>|Schema| SchemaError\[Report Schema Error\]  
    ValidErrType \--\>|Business Rule| BusinessError\[Report Business Rule Violation\]  
    ValidErrType \--\>|Dependency| DependencyError\[Report Missing Dependency\]  
      
    SchemaError \--\> UserFixSchema\[User Fixes Input\]  
    BusinessError \--\> UserFixBusiness\[User Adjusts Configuration\]  
    DependencyError \--\> ResolveDepend\[Resolve Dependency\]  
      
    UserFixSchema \--\> ReValidate\[Re-validate Input\]  
    UserFixBusiness \--\> ReValidate  
    ResolveDepend \--\> ReValidate  
      
    ReValidate \--\> RetryOp2\[Retry Operation\]  
      
    %% API Error Handling  
    APIError \--\> APIErrType{API Error Type}  
    APIErrType \--\>|Transient| TransientError\[Log Transient Error\]  
    APIErrType \--\>|Permanent| PermanentError\[Log Permanent Error\]  
    APIErrType \--\>|Partial Success| PartialError\[Log Partial Success\]  
      
    TransientError \--\> RetryCheck{Retry Count \< Max?}  
    RetryCheck \--\>|Yes| RetryOp3\[Retry API Call\]  
    RetryCheck \--\>|No| EscalateAPI\[Escalate to Rollback\]  
      
    PermanentError \--\> EscalateAPI  
    PartialError \--\> AssessImpact\[Assess Operation Impact\]  
      
    %% System Error Handling  
    SystemError \--\> SysErrType{System Error Type}  
    SysErrType \--\>|Memory| MemoryError\[Memory Optimization\]  
    SysErrType \--\>|Crash| CrashError\[Crash Recovery\]  
    SysErrType \--\>|Timeout| TimeoutError\[Timeout Handling\]  
      
    MemoryError \--\> CleanupResources\[Clean Resources\]  
    CrashError \--\> RestoreState\[Restore Last Known State\]  
    TimeoutError \--\> CancelOperation\[Cancel Current Operation\]  
      
    CleanupResources \--\> RetryOp4\[Retry Operation\]  
    RestoreState \--\> NotifyUserSystem\[Notify User\]  
    CancelOperation \--\> NotifyUserSystem  
      
    %% Rollback Process  
    subgraph RollbackProc\[Rollback Process\]  
        InitiateRollback\[Initiate Rollback\]  
        CheckRestore{Restore Point Available?}  
        CreateRollbackPlan\[Create Rollback Plan\]  
        ExecuteRollback\[Execute Rollback Operations\]  
        VerifyRollback\[Verify Rollback Success\]  
        LogRollback\[Log Rollback Details\]  
    end  
      
    EscalateAPI \--\> InitiateRollback  
    AssessImpact \--\>|Critical Impact| InitiateRollback  
    AssessImpact \--\>|Minor Impact| LogAndContinue\[Log and Continue\]  
      
    InitiateRollback \--\> CheckRestore  
    CheckRestore \--\>|Yes| CreateRollbackPlan  
    CheckRestore \--\>|No| ManualRecovery\[Manual Recovery Required\]  
      
    CreateRollbackPlan \--\> ExecuteRollback  
    ExecuteRollback \--\> VerifyRollback  
    VerifyRollback \--\>|Success| LogRollback  
    VerifyRollback \--\>|Failure| ManualRecovery  
      
    %% User Notification Flow  
    subgraph UserNotify\[User Notification Flow\]  
        PrepareMessage\[Prepare Error Message\]  
        DetermineUrg{Determine Urgency}  
        ToastNotification\[Toast Notification\]  
        ModalAlert\[Modal Alert\]  
        StatusUpdate\[Status Update\]  
        DetailedLog\[Add to Error Log\]  
    end  
      
    LogRollback \--\> PrepareMessage  
    ManualRecovery \--\> PrepareMessage  
    NotifyUserDelay \--\> PrepareMessage  
    NotifyUserSystem \--\> PrepareMessage  
    LogAndContinue \--\> PrepareMessage  
      
    PrepareMessage \--\> DetermineUrg  
    DetermineUrg \--\>|Low| ToastNotification  
    DetermineUrg \--\>|High| ModalAlert  
    DetermineUrg \--\>|Medium| StatusUpdate  
      
    ToastNotification \--\> DetailedLog  
    ModalAlert \--\> DetailedLog  
    StatusUpdate \--\> DetailedLog  
      
    DetailedLog \--\> UserAct{User Action Required?}  
    UserAct \--\>|Yes| PromptUserAction\[Prompt User for Action\]  
    UserAct \--\>|No| EndErrorFlow(\[End Error Handling\])  
      
    PromptUserAction \--\> UserResponds\[User Responds\]  
    UserResponds \--\> ProcessResponse\[Process User Response\]  
    ProcessResponse \--\> EndErrorFlow  
      
    %% Styling  
    classDef process fill:\#2D72B8,color:\#fff,stroke:\#fff  
    classDef decision fill:\#4A90E2,color:\#fff,stroke:\#fff  
    classDef error fill:\#D13B3B,color:\#fff,stroke:\#fff  
    classDef recovery fill:\#25A169,color:\#fff,stroke:\#fff  
    classDef notification fill:\#E5A83B,color:\#fff,stroke:\#fff  
    classDef endpoint fill:\#343A40,color:\#fff,stroke:\#fff  
    classDef subgraph\_style fill:none,stroke:\#999,stroke-width:1px,color:\#333  
      
    class Start,ContinueOp,EndErrorFlow endpoint  
    class ErrorDetect,ErrorClass,AuthErrType,ValidErrType,APIErrType,SysErrType,CheckRestore,DetermineUrg,RetryCheck,UserAct decision  
    class AuthError,RateLimitError,ValidationError,APIError,SystemError,SchemaError,BusinessError,DependencyError,TransientError,PermanentError,PartialError,MemoryError,CrashError,TimeoutError error  
    class TokenRefresh,ReAuth,GetRateInfo,CalculateBackoff,QueueOperation,WaitBackoff,ReValidate,RetryAuth,RetryOp1,RetryOp2,RetryOp3,RetryOp4,InitiateRollback,CreateRollbackPlan,ExecuteRollback,VerifyRollback process  
    class UserReAuth,UserFixSchema,UserFixBusiness,ResolveDepend,CleanupResources,RestoreState,CancelOperation,LogRollback,ManualRecovery recovery  
    class NotifyUserDelay,PermissionNotify,NotifyUserSystem,PrepareMessage,ToastNotification,ModalAlert,StatusUpdate,DetailedLog,PromptUserAction notification  
      
    class ErrorCat,RollbackProc,UserNotify subgraph\_style