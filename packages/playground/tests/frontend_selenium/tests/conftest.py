import pytest
from selenium import webdriver
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service as ChromeService
from pyvirtualdisplay import Display

"""
This module contains shared browser fixtures.
"""

@pytest.fixture
def browser():

    # Virtual display for the browser, allowing it to run in headless mode
    display = Display(visible=0, size=(1920, 1080))
    display.start()

    # Initialize the ChromeDriver instance with options
    options = webdriver.ChromeOptions()
    #options.add_extension('extension.crx')  # For Adding Extension
    driver = webdriver.Chrome(options=options)
    # driver = webdriver.Chrome(options=options, service=ChromeService(ChromeDriverManager().install()))
    driver.set_window_size(1920, 1080)

    # Make its calls wait up to 60 seconds for elements to appear
    driver.implicitly_wait(60)

    # Return the WebDriver instance for the setup
    yield driver

    # Quit the WebDriver instance for the cleanup
    driver.quit()
    # Ending virtual display for the browser
    display.stop()