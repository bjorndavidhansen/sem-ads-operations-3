sequenceDiagram  
    actor User  
    participant App as Desktop Application  
    participant Browser as Default Browser  
    participant GoogleAuth as Google OAuth Server  
    participant SecureStorage as Secure Local Storage  
    participant GoogleAdsAPI as Google Ads API

    %% Initial Authentication  
    User-\>\>App: Launch application  
    App-\>\>App: Check for existing valid tokens  
    App-\>\>User: Display sign-in prompt  
    User-\>\>App: Click "Sign in with Google"  
      
    %% OAuth Authorization Flow  
    App-\>\>App: Generate state parameter for CSRF protection  
    App-\>\>SecureStorage: Store state parameter  
    App-\>\>Browser: Open OAuth URL with required scopes  
    Note right of App: Required scopes for Google Ads API access  
      
    Browser-\>\>GoogleAuth: Redirect to authorization URL  
    GoogleAuth-\>\>User: Present consent screen  
    User-\>\>GoogleAuth: Grant permissions  
    GoogleAuth-\>\>Browser: Redirect with authorization code  
    Browser-\>\>App: Return authorization code via custom protocol  
      
    %% Token Exchange  
    App-\>\>SecureStorage: Retrieve state parameter  
    App-\>\>App: Validate state to prevent CSRF  
    App-\>\>GoogleAuth: Exchange code for tokens  
    Note right of App: Include client ID & secret from secure storage  
      
    GoogleAuth-\>\>App: Return access & refresh tokens  
      
    %% Secure Storage  
    App-\>\>App: Encrypt tokens  
    App-\>\>SecureStorage: Store encrypted tokens  
    Note right of SecureStorage: Tokens stored using OS secure storage mechanisms  
      
    %% Using the API  
    App-\>\>SecureStorage: Retrieve access token  
    App-\>\>App: Verify token expiration  
      
    alt Token is valid  
        App-\>\>GoogleAdsAPI: Make API request with access token  
        GoogleAdsAPI-\>\>App: Return API response  
    else Token is expired  
        App-\>\>SecureStorage: Retrieve refresh token  
        App-\>\>GoogleAuth: Request new access token  
        GoogleAuth-\>\>App: Return new access token  
        App-\>\>SecureStorage: Update stored access token  
        App-\>\>GoogleAdsAPI: Make API request with new token  
        GoogleAdsAPI-\>\>App: Return API response  
    end  
      
    %% Session Management  
    User-\>\>App: Continue using application  
    App-\>\>App: Maintain token state during session  
      
    %% Sign Out  
    User-\>\>App: Sign out  
    App-\>\>SecureStorage: Remove refresh token (optional)  
    App-\>\>App: Clear session data  
    App-\>\>User: Show signed out state  
      
    %% Security Considerations  
    Note over App,SecureStorage: No plain-text credentials stored  
    Note over App,GoogleAdsAPI: Rate limiting handling with exponential backoff  
    Note over App,GoogleAuth: Token refresh handled automatically  
    Note over App,SecureStorage: Access tokens have limited lifespan  
    Note over App,GoogleAuth: OAuth state verification prevents CSRF attacks