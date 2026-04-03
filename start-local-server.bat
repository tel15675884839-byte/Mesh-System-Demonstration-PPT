@echo off
setlocal

set "PORT=8765"
set "ROOT=%~dp0"

pushd "%ROOT%"

where py >nul 2>nul
if %ERRORLEVEL%==0 (
  set "PYTHON_CMD=py"
  goto run_server
)

where python >nul 2>nul
if %ERRORLEVEL%==0 (
  set "PYTHON_CMD=python"
  goto run_server
)

echo Python was not found.
echo Install Python or update PATH, then run this script again.
popd
exit /b 1

:run_server
echo Starting local presentation server at http://127.0.0.1:%PORT%/
echo Press Ctrl+C in this window to stop the server.
start "" "http://127.0.0.1:%PORT%/"
%PYTHON_CMD% -m http.server %PORT%

popd
endlocal
