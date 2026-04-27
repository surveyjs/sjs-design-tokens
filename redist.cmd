@echo off
echo Starting redistribution of theme files...

REM Check if build directory exists
if not exist "build" (
    echo Error: build directory not found. Please run the conversion script first.
    exit /b 1
)

echo Copying base-theme.scss...
if not exist "..\survey-library\packages\survey-core\src\default-theme" (
    echo Warning: ..\survey-library\packages\survey-core\src\default-theme directory not found.
) else (
    xcopy "build\base-theme.scss" "..\survey-library\packages\survey-core\src\default-theme\" /Y /I
    if %errorlevel% equ 0 (
        echo base-theme.scss copied successfully.
    ) else (
        echo Error copying base-theme.scss.
    )
)

if exist "build\themes" (
    echo Copying themes...
    if not exist "..\survey-library\packages\survey-core\src\themes" (
        echo Warning: ..\survey-library\packages\survey-core\src\themes directory not found.
    ) else (
        xcopy "build\themes\*" "..\survey-library\packages\survey-core\src\themes\" /Y /I
        if %errorlevel% equ 0 (
            echo Themes copied successfully.
        ) else (
            echo Error copying themes.
        )
    )
) else (
    echo Warning: build\themes directory not found.
)

REM (products folders were removed; themes live in build\themes)

echo Redistribution completed!
