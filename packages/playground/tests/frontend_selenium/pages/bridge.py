from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.alert import Alert
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import StaleElementReferenceException
import time

class BridgePage:

    """
    This module contains TF Token Bridge page elements.
    """

    logout_button = (By.XPATH, "//button[.//span[text()=' Logout ']]")
    tfchain_button = (By.XPATH, "//span[text()='TFChain']")
    bridge_page = (By.XPATH, "//span[text()='TF Token Bridge']")
    transfer_tft_title = (By.XPATH, "//*[contains(text(), 'Transfer TFT Across Chains')]")
    stellar_choose = (By.XPATH, "//*[contains(text(), 'stellar')]")
    withdraw = (By.XPATH, "//button[.//span[text()='Withdraw']]")
    deposit =  (By.XPATH, "//button[.//span[text()='Deposit']]")
    howdone =  (By.XPATH, "//button[.//span[text()='Learn How?']]")
    deposite_bridge_address = (By.XPATH, "(//label[text()='Destination'])[1]/following-sibling::input")
    twin_id_text = (By.XPATH,"(//label[text()='Memo Text'])[1]/following-sibling::input")
    twin_address_text = (By.XPATH, '/html/body/div[1]/div/div/main/div/div[2]/div/div/div/div[2]/div[2]/div[1]/div/div[3]/div[2]/div/div/div/div[1]/span')
    twin_page = (By.XPATH, "//span[text()='Your Profile']")
    deposit_close_button = (By.XPATH, "(//button[.//span[text()=' Close ']])[2]")
    deposit_learn_button = (By.XPATH, "//a[.//span[text()='Learn more?']]")
    stellar_address = (By.XPATH, "//label[text()='Stellar Target Wallet Address']/following-sibling::input")
    amount_tft = (By.XPATH, "//input[@class='v-field__input' and @type='number']")
    submit_button = (By.XPATH, "//button[.//span[text()='Send']]")
    balance_text = (By.XPATH,'/html/body/div[1]/div/div/main/header/div/div[3]/div[2]/p[1]/strong')
    tft_amount_text = (By.XPATH, "//*[contains(text(), 'Deposit fee is 1 TFT')]")


    def __init__(self, browser):
        self.browser = browser

    def navigate_to_bridge(self):
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.logout_button))
        webdriver.ActionChains(self.browser).send_keys(Keys.ESCAPE).perform()
        self.browser.find_element(*self.tfchain_button).click()
        self.browser.find_element(*self.bridge_page).click()
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.transfer_tft_title))
    
    def twin_address(self):
        self.browser.find_element(*self.deposit_close_button).click()
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.twin_page))
        self.browser.find_element(*self.twin_page).click()
        return self.browser.find_element(*self.twin_address_text).text 

    def transfer_chain(self):
        self.browser.find_element(*self.stellar_choose).click()

    def choose_deposit(self):
        self.browser.find_element(*self.deposit).click()

    def choose_withdraw(self):
        self.browser.find_element(*self.withdraw).click()

    def how_it_done(self):
        self.browser.find_element(*self.howdone).click()
        WebDriverWait(self.browser, 30).until(EC.number_of_windows_to_be(2))
        self.browser.switch_to.window(self.browser.window_handles[1])
        url = self.browser.current_url
        self.browser.close()
        self.browser.switch_to.window(self.browser.window_handles[0])
        return url

    def deposite_learn_more(self):
        self.browser.find_element(*self.deposit).click()
        self.wait_for_button(self.browser.find_element(*self.deposit_learn_button)).click()
        WebDriverWait(self.browser, 30).until(EC.number_of_windows_to_be(2))
        self.browser.switch_to.window(self.browser.window_handles[1])
        return self.browser.current_url
    
    def check_deposit(self):
        self.browser.find_element(*self.deposit).click() 
        amount_text = self.browser.find_element(*self.tft_amount_text).text
        bridge_address =  self.browser.find_element(*self.deposite_bridge_address).get_attribute("value")
        twin_id = self.browser.find_element(*self.twin_id_text).get_attribute("value")
        return twin_id, amount_text, bridge_address

    def setup_withdraw_tft(self, data):
        self.browser.find_element(*self.withdraw).click()
        self.browser.find_element(*self.amount_tft).send_keys(Keys.CONTROL + "a")
        self.browser.find_element(*self.amount_tft).send_keys(Keys.DELETE)
        self.browser.find_element(*self.amount_tft).send_keys(data)
    
    def setup_widthdraw_address(self, data):
        balance = 'Loadin'
        while(balance == 'Loadin'):
            while True:
                try:
                    balance = self.browser.find_element(*self.balance_text).text[:-4]
                    break  # Exit the loop if interaction is successful
                except StaleElementReferenceException:
                    time.sleep(0.5)
        self.browser.find_element(*self.withdraw).click()
        self.browser.find_element(*self.stellar_address).send_keys(Keys.CONTROL + "a")
        self.browser.find_element(*self.stellar_address).send_keys(Keys.DELETE)
        self.browser.find_element(*self.stellar_address).send_keys(data)
        return balance

    def check_withdraw_invalid_stellar(self, data):
        self.browser.find_element(*self.stellar_address).send_keys(Keys.CONTROL + "a")
        self.browser.find_element(*self.stellar_address).send_keys(Keys.DELETE)
        self.browser.find_element(*self.stellar_address).send_keys(data)
        time.sleep(2)
        return self.browser.find_element(*self.submit_button).is_enabled()

    def check_withdraw_tft_amount(self, data):
        self.browser.find_element(*self.amount_tft).send_keys(Keys.CONTROL + "a")
        self.browser.find_element(*self.amount_tft).send_keys(Keys.DELETE)
        self.browser.find_element(*self.amount_tft).send_keys(data)
        WebDriverWait(self.browser, 30).until(EC.element_to_be_clickable(self.submit_button))
        time.sleep(2)
        return self.browser.find_element(*self.submit_button).is_enabled()

    def check_withdraw_invalid_tft_amount(self, data):
        self.browser.find_element(*self.amount_tft).send_keys(Keys.CONTROL + "a")
        self.browser.find_element(*self.amount_tft).send_keys(Keys.DELETE)
        self.browser.find_element(*self.amount_tft).send_keys(data)
        time.sleep(2)
        return self.browser.find_element(*self.submit_button).is_enabled()

    def check_withdraw(self, address, amount):
        self.browser.find_element(*self.withdraw).click()
        self.wait_for('Interact with the bridge in order to withdraw your TFT to Stellar (withdraw fee is: 1 TFT)')
        self.browser.find_element(*self.amount_tft).send_keys(Keys.CONTROL + "a")
        self.browser.find_element(*self.amount_tft).send_keys(Keys.DELETE)
        self.browser.find_element(*self.amount_tft).send_keys(amount)
        self.browser.find_element(*self.stellar_address).send_keys(Keys.CONTROL + "a")
        self.browser.find_element(*self.stellar_address).send_keys(Keys.DELETE)
        self.browser.find_element(*self.stellar_address).send_keys(address)
        WebDriverWait(self.browser, 30).until(EC.element_to_be_clickable(self.submit_button))
        return self.browser.find_element(*self.submit_button)
    
    def get_balance(self):
        while True:
            try:
                new_balance = self.browser.find_element(*self.balance_text).text[:-4]
                break  # Exit the loop if interaction is successful
            except StaleElementReferenceException:
                time.sleep(0.5)
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.transfer_tft_title))
        while('Loadin' in new_balance):
            self.wait_for(' Balance: ')
            while True:
                try:
                    new_balance = self.browser.find_element(*self.balance_text).text[:-4]
                    break  # Exit the loop if interaction is successful
                except StaleElementReferenceException:
                    time.sleep(0.5)
        return new_balance
    
    def get_balance_withdraw(self, balance):
        while True:
            try:
                new_balance = self.browser.find_element(*self.balance_text).text[:-4]
                break  # Exit the loop if interaction is successful
            except StaleElementReferenceException:
                time.sleep(0.5)
        self.browser.refresh()
        # alert = Alert(self.browser)
        # alert.accept()
        while(new_balance==balance):
            while True:
                try:
                    new_balance = self.browser.find_element(*self.balance_text).text[:-4]
                    break  # Exit the loop if interaction is successful
                except StaleElementReferenceException:
                    time.sleep(0.5)
        return new_balance

    def wait_for_button(self, button):
        WebDriverWait(self.browser, 30).until(EC.element_to_be_clickable(button))
        return button

    def wait_for(self, keyword):
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located((By.XPATH, "//*[contains(text(), '"+ keyword +"')]")))
        return True