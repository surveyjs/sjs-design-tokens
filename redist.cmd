@echo off
echo Starting redistribution of theme files...

REM Check if build directory exists
if not exist "build" (
    echo Error: build directory not found. Please run the conversion script first.
    exit /b 1
)

REM Copy survey-creator themes
if exist "build\survey-creator" (
    echo Copying survey-creator themes...
    if not exist "..\survey-creator\packages\survey-creator-core\src\themes" (
        echo Warning: ..\survey-creator\packages\survey-creator-core\src\themes directory not found.
    ) else (
        xcopy "build\survey-creator\*" "..\survey-creator\packages\survey-creator-core\src\themes\" /Y /I
        if %errorlevel% equ 0 (
            echo Survey-creator themes copied successfully.
        ) else (
            echo Error copying survey-creator themes.
        )
    )
    if not exist "..\survey-analytics\src\themes" (
        echo Warning: ..\survey-analytics\src\themes directory not found.
    ) else (
        xcopy "build\survey-analytics\*" "..\survey-analytics\src\themes\" /Y /I
        if %errorlevel% equ 0 (
            echo Survey-analytics themes copied successfully.
        ) else (
            echo Error copying survey-analytics themes.
        )
    )
) else (
    echo Warning: build\survey-creator directory not found.
)

echo Redistribution completed!
