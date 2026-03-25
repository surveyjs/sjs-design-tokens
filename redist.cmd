@echo off
echo Starting redistribution of theme files...

REM Check if build directory exists
if not exist "build" (
    echo Error: build directory not found. Please run the conversion script first.
    exit /b 1
)

if exist "build\survey-library" (
    echo Copying survey-library themes...
    if not exist "..\survey-library\packages\survey-core\src\themes" (
        echo Warning: ..\survey-library\packages\survey-core\src\themes directory not found.
    ) else (
        xcopy "build\survey-library\*" "..\survey-library\packages\survey-core\src\themes\" /Y /I
        if %errorlevel% equ 0 (
            echo survey-library themes copied successfully.
        ) else (
            echo Error copying survey-library themes.
        )
    )
) else (
    echo Warning: build\survey-library directory not found.
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
        xcopy "build\survey-creator\default-light.ts" "..\survey-analytics\src\themes\" /Y /I
        xcopy "build\survey-creator\default-dark.ts" "..\survey-analytics\src\themes\" /Y /I
        if %errorlevel% equ 0 (
            echo Survey-analytics themes copied successfully.
        ) else (
            echo Error copying survey-analytics themes.
        )
    )
) else (
    echo Warning: build\survey-creator directory not found.
)

if exist "build\survey-pdf" (
    echo Copying survey-pdf themes...
    if not exist "..\survey-pdf\src\themes" (
        echo Warning: ..\survey-pdf\src\themes directory not found.
    ) else (
        xcopy "build\survey-pdf\*" "..\survey-pdf\src\themes\" /Y /I
        if %errorlevel% equ 0 (
            echo Survey-pdf themes copied successfully.
        ) else (
            echo Error copying survey-pdf themes.
        )
    )
) else (
    echo Warning: build\survey-pdf directory not found.
)

echo Redistribution completed!
