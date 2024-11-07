from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.alert import Alert
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import StaleElementReferenceException
from utils.base import Base
import time

class DashboardPage:

    """
    This module contains Dashboard Homepage and Profile Manager elements.
    """

    profile_load_label = (By.XPATH, "//*[contains(text(), 'TFChain Wallet')]")
    threefold_load_label = (By.XPATH, "//*[contains(text(), 'A Co-Owned Global Sovereign Internet')]")
    manual_button = (By.XPATH, "//*[contains(text(), 'the manual')]")
    find_more_button = (By.XPATH, "//*[contains(text(), 'Find More!')]")
    Explore_grid_capacity_button = (By.XPATH, "//a[.//span[text()=' Explore ThreeFold Grid Capacity ']]")
    learn_about_grid_button = (By.XPATH, "//a[.//span[text()=' Learn about the grid ']]")
    tft_price_label = (By.XPATH, '/html/body/div[1]/div/div/main/header/div/div[2]/div/div/div/span[1]')
    usd_price_label = (By.XPATH, '/html/body/div[1]/div/div/main/header/div/div[2]/div/div/div/span[2]')
    tft_swap_button = (By.XPATH, '/html/body/div[1]/div/div/main/header/div/div[2]/div/div/div/button/span[3]/i')
    tft_info_button = (By.XPATH, '/html/body/div[1]/div/div/main/header/div/div[2]/div/div/div/a/span[3]/i')
    stellar_tft_price_label = (By.XPATH, "//dt[text()='Current price:']/following-sibling::dd/span[1]")
    stellar_tft_price_change_label = (By.XPATH, "//span[contains(@class, 'price-change') and @aria-label]")
    mnemonic_input = (By.XPATH, "//input[@placeholder='Please insert your Mnemonic or Hex Seed']")
    email_input = (By.XPATH, "//input[@placeholder='email@example.com']")
    password_input = (By.XPATH, "(//input[@size='1' and @type='password'])[2]")
    confirm_password_input = (By.XPATH, "(//input[@size='1' and @type='password'])[3]")
    generate_account_button = (By.XPATH, "//button[.//span[text()=' create account ']]")
    connect_button = (By.XPATH, "//button[.//span[text()='Connect']]")
    logout_button = (By.XPATH, "/html/body/div[1]/div/div/main/header[1]/div/div[3]/button")
    login_button = (By.XPATH, "//button[.//span[text()='Login']]")
    login_password_input = (By.XPATH, "//label[text()='Password']/following-sibling::input")
    accept_terms_condition_button = (By.XPATH, "//button[.//span[text()='Accept terms and conditions']]")
    connect_manual_button = (By.XPATH, "//p[@class='mb-4 text-center']/a")
    connect_google_button = (By.XPATH, "//a[@title='play-store']")
    connect_apple_button = (By.XPATH, "//a[@title='app-store']")
    iframe_load_label = (By.XPATH, "//*[contains(text(), 'THESE TERMS AND CONDITIONS')]")
    mnemonic_input_reveal_button = (By.XPATH, "//i[@aria-label='Your Mnemonic appended action']")
    mnemonic_login_label = (By.XPATH, "//label[text()='Your Mnemonic']/following-sibling::input")
    email_login_label = (By.XPATH, "//label[text()='Email']/following-sibling::input")
    id_login_label = (By.XPATH, "//label[text()='Twin ID']/following-sibling::input")
    address_login_label = (By.XPATH, "//label[text()='Address']/following-sibling::input")
    capacity_stats = (By.XPATH, "//p[contains(@class, 'text-center') and following-sibling::p[text()='Capacity']]")
    nodes_stats = (By.XPATH, "//p[contains(@class, 'text-center') and following-sibling::p[text()='Nodes']]")
    countries_stats = (By.XPATH, "//p[contains(@class, 'text-center') and following-sibling::p[text()='Countries']]")
    cores_stats = (By.XPATH, "//p[contains(@class, 'text-center') and following-sibling::p[text()='Cores']]")
    profile_button = (By.XPATH, '/html/body/div[1]/div/div/main/header[1]/div/div[3]/i')
    profile_label = (By.XPATH, '/html/body/div[1]/div/div/main/div/div[2]/div/div/div/div[1]/div/div[1]')
    qr_code_img = (By.XPATH, "//img[@alt='qrcode']")
    sidebar_manual = (By.XPATH, "//span[text()='Manual']")

    def __init__(self, browser):
        self.browser = browser
    
    def open_and_load(self):
        self.browser.get(Base.base_url)
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.profile_load_label))
        time.sleep(5)
    
    def press_esc_key(self):
        webdriver.ActionChains(self.browser).send_keys(Keys.ESCAPE).perform()
    
    def import_account(self, seed, validation=True):
        self.browser.find_element(*self.mnemonic_input).send_keys(Keys.CONTROL + "a")
        self.browser.find_element(*self.mnemonic_input).send_keys(Keys.DELETE)
        self.browser.find_element(*self.mnemonic_input).send_keys(seed)
        if(validation):
            WebDriverWait(self.browser, 30).until(EC.element_to_be_clickable(self.email_input))

    def connect_your_wallet(self, email, password):
        self.browser.find_element(*self.email_input).send_keys(Keys.CONTROL + "a")
        self.browser.find_element(*self.email_input).send_keys(Keys.DELETE)
        self.browser.find_element(*self.email_input).send_keys(email)
        self.browser.find_element(*self.password_input).send_keys(Keys.CONTROL + "a")
        self.browser.find_element(*self.password_input).send_keys(Keys.DELETE)
        self.browser.find_element(*self.password_input).send_keys(password)
        self.browser.find_element(*self.confirm_password_input).send_keys(Keys.CONTROL + "a")
        self.browser.find_element(*self.confirm_password_input).send_keys(Keys.DELETE)
        self.browser.find_element(*self.confirm_password_input).send_keys(password)
        return self.browser.find_element(*self.connect_button)

    def logout_account(self):
        time.sleep(3)
        while True:
            try:
                self.wait_for_button(self.browser.find_element(*self.logout_button)).click()
                break  # Exit the loop if interaction is successful
            except StaleElementReferenceException:
                time.sleep(0.5)
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.find_more_button))
        self.browser.refresh()
        # alert = Alert(self.browser)
        # alert.accept()
        self.browser.switch_to.window(self.browser.window_handles[0])
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.profile_load_label))
    
    def login_account(self, password):
        self.browser.find_element(*self.login_password_input).send_keys(Keys.CONTROL + "a")
        self.browser.find_element(*self.login_password_input).send_keys(Keys.DELETE)
        self.browser.find_element(*self.login_password_input).send_keys(password)
        return self.browser.find_element(*self.login_button)

    def create_account(self):
        self.browser.find_element(*self.generate_account_button).click()

    def accept_terms_conditions(self):
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.iframe_load_label))
        self.browser.find_element(*self.iframe_load_label).click()
        webdriver.ActionChains(self.browser).send_keys(Keys.PAGE_DOWN).perform()
        self.browser.find_element(*self.accept_terms_condition_button).click()
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.generate_account_button))
        WebDriverWait(self.browser, 30).until(EC.element_to_be_clickable(self.password_input))

    def click_button(self, button):
        WebDriverWait(self.browser, 60).until(EC.element_to_be_clickable(button))
        button.click()

    def confirm_password(self, password): 
        self.browser.find_element(*self.confirm_password_input).send_keys(Keys.CONTROL + "a")
        self.browser.find_element(*self.confirm_password_input).send_keys(Keys.DELETE)       
        self.browser.find_element(*self.confirm_password_input).send_keys(password)

    def get_mnemonic(self):
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.logout_button))
        WebDriverWait(self.browser, 30).until(EC.element_to_be_clickable(self.mnemonic_input_reveal_button)).click()
        return self.browser.find_element(*self.mnemonic_login_label).get_attribute("value")
    
    def get_email(self):
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.logout_button))
        return self.browser.find_element(*self.email_login_label).get_attribute("value")
    
    def get_id(self):
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.logout_button))
        return self.browser.find_element(*self.id_login_label).get_attribute("value")
    
    def get_address(self):
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.logout_button))
        return self.browser.find_element(*self.address_login_label).get_attribute("value")

    def tft_price_result(self):
        return self.browser.find_element(*self.tft_price_label).text

    def usd_price_result(self):
        return self.browser.find_element(*self.usd_price_label).text

    def tft_price_swap(self):
        price = self.browser.find_element(*self.tft_price_label).text
        self.browser.find_element(*self.tft_swap_button).click()
        while (price == self.browser.find_element(*self.tft_price_label).text):
            WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located((By.XPATH, "//*[contains(text(), '1 USD')]")))
        self.browser.find_element(*self.threefold_load_label).click()

    def get_tft_price(self):
        self.browser.find_element(*self.tft_info_button).click()
        WebDriverWait(self.browser, 30).until(EC.number_of_windows_to_be(2))
        self.browser.switch_to.window(self.browser.window_handles[1])
        price = (self.browser.find_element(*self.stellar_tft_price_label).text).replace(self.browser.find_element(*self.stellar_tft_price_change_label).text, "")
        return float(price[:-3])
    
    def get_dashboard_stats(self):
        stats = []
        self.press_esc_key()
        stats.append(self.browser.find_element(*self.capacity_stats).text)
        stats.append(int(self.browser.find_element(*self.nodes_stats).text))
        stats.append(int(self.browser.find_element(*self.countries_stats).text))
        stats.append(int(self.browser.find_element(*self.cores_stats).text))
        return stats
    
    def open_profile(self):
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.profile_label))
        self.browser.find_element(*self.profile_button).click()
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.qr_code_img))
        WebDriverWait(self.browser, 30).until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'TFChain Wallet')]")))
        time.sleep(3)
    
    def get_link(self):
        WebDriverWait(self.browser, 30).until(EC.number_of_windows_to_be(2))
        self.browser.switch_to.window(self.browser.window_handles[1])
        url = self.browser.current_url
        self.browser.close()
        self.browser.switch_to.window(self.browser.window_handles[0])
        return url

    def navigate_to_find_more(self):
        self.press_esc_key()
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.find_more_button))
        self.browser.find_element(*self.find_more_button).click()
        return self.get_link()

    def navigate_to_explore_capacity(self):
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.Explore_grid_capacity_button))
        self.browser.execute_script("window.scrollBy(0, 250);")
        self.browser.find_element(*self.Explore_grid_capacity_button).click()
        return self.get_link()

    def navigate_to_learn_about_grid(self):
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.learn_about_grid_button))
        webdriver.ActionChains(self.browser).send_keys(Keys.END).perform()
        webdriver.ActionChains(self.browser).send_keys(Keys.PAGE_DOWN).perform()
        time.sleep(3)
        self.browser.find_element(*self.learn_about_grid_button).click()
        return self.get_link()
    
    def manual_link(self):
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.logout_button))
        WebDriverWait(self.browser, 30).until(EC.presence_of_element_located(self.qr_code_img))
        WebDriverWait(self.browser, 30).until(EC.element_to_be_clickable(self.connect_manual_button))
        WebDriverWait(self.browser, 30).until(EC.element_to_be_clickable(self.manual_button)).click()
        return self.get_link()
    
    def connect_manual_link(self):
        self.browser.find_element(*self.connect_manual_button).click()
        return self.get_link()
    
    def get_connect_google_link(self):
        self.browser.find_element(*self.connect_google_button).click()
        return self.get_link()

    def get_connect_apple_link(self):
        self.browser.find_element(*self.connect_apple_button).click()
        return self.get_link()

    def manual_page(self):
        self.browser.find_element(*self.sidebar_manual).click()
        return self.get_link()

    def wait_for_button(self, button):
        WebDriverWait(self.browser, 30).until(EC.element_to_be_clickable(button))
        return button
    
    def wait_for(self, keyword):
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located((By.XPATH, "//*[contains(text(), '"+ keyword +"')]")))
        return True