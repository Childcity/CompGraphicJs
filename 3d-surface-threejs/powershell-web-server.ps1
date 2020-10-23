$http = [System.Net.HttpListener]::new()
# Hostname and port to listen on
$http.Prefixes.Add("http://localhost:8080/")
# Start the Http Server
$http.Start()

Add-Type -AssemblyName System.Web
# Log ready message to terminal
if ($http.IsListening) {
    write-host "HTTP Server Ready!  " -f 'black' -b 'gre'
    write-host "$($http.Prefixes)" -f 'y'
}

$scriptpath = $MyInvocation.MyCommand.Path
$dir = Split-Path $scriptpath
Write-host "My directory is $dir"

# INFINTE LOOP
# Used to listen for requests
while ($http.IsListening) {
    # Get Request Url
    # When a request is made in a web browser the GetContext() method will return a request object
    # Our route examples below will use the request object properties to decide how to respond
    $context = $http.GetContext()

    if ($context.Request.HttpMethod -eq 'GET') {

        # We can log the request to the terminal
        write-host "$($context.Request.UserHostAddress)  =>  $($context.Request.Url)" -f 'mag'


        $URL = $context.Request.Url.LocalPath
        write-host "Requested: "$URL 

        # Redirect root to index.html
        if($URL -eq "/") {
          $URL = $dir + "/index.html"
        } else {
          $URL = $dir + $URL
        }
                   
        write-host "Responsing: "$URL
        

        try { 
          $ContentStream = [System.IO.File]::OpenRead( "$URL" );
          $Context.Response.ContentType = [System.Web.MimeMapping]::GetMimeMapping("web/$URL")
          $ContentStream.CopyTo( $Context.Response.OutputStream );
          $ContentStream.Close();
          
        } catch { 
          Write-Host "An error occurred." 
          Write-Host $_
          $enc = [system.Text.Encoding]::UTF8
          $errmsg = "Error: " + $_ 
          $data = $enc.GetBytes($errmsg);
          $Context.Response.StatusCode = 404;
          $Context.Response.OutputStream.Write($data, 0, $data.Length);
        }
        $Context.Response.Close()
    }
    # powershell will continue looping and listen for new requests...
}