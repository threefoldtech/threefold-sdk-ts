from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


class NodePage:
    """
    This module contains Node table elements in Your Farms page.
    """

    logout_button = (By.XPATH, "//button[.//span[text()=' Logout ']]")
    tfchain_button = (By.XPATH, "//span[text()='TFChain']")
    your_profile_button = (By.XPATH, "//span[text()='Your Profile']")
    twin_id_label = (By.XPATH, '/html/body/div[1]/div/div/main/div/div[2]/div/div/div/div[2]/div[2]/div[1]/div/div[1]/div[2]/div/div/div')
    farm_section = (By.XPATH, "//span[text()='Farms']")
    farm_page = (By.XPATH, "//span[text()='Your Farms']")
    node_page = (By.XPATH, "//*[contains(text(), 'Your Nodes')]")
    node_table = (By.XPATH, "//span[text()='Node ID']/ancestor::table/tbody/tr")
    ipv4 = (By.XPATH, "//label[text()='IPv4']/following-sibling::input")
    ipv4_gateway = (By.XPATH, "//label[text()='Gateway IPv4']/following-sibling::input")
    ipv6 = (By.XPATH, "//label[text()='IPv6']/following-sibling::input")
    ipv6_gateway = (By.XPATH, "//label[text()='Gateway IPv6']/following-sibling::input")
    domain = (By.XPATH, "//label[text()='Domain']/following-sibling::input")
    remove = (By.XPATH, "//button[.//span[text()=' Remove Config ']]")
    submit = (By.XPATH, "//button[.//span[text()='Remove']]")
    save = (By.XPATH, "//button[.//span[text()=' Save ']]")
    fee_input = (By.XPATH, "//label[text()='Additional Fees']/following-sibling::input")
    set_btn = (By.XPATH, "//button[.//span[text()='Save']]")

    def __init__(self, browser):
        self.browser = browser

    def navigate(self):
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.logout_button))
        self.browser.find_element(*self.tfchain_button).click()
        self.browser.find_element(*self.your_profile_button).click()
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.twin_id_label))
        self.twin_id = self.browser.find_element(*self.twin_id_label).text
        self.browser.find_element(*self.farm_section).click()
        self.browser.find_element(*self.farm_page).click()
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.node_page))

    def setup_config(self, node_id):
        for i in range(1, len(self.browser.find_elements(*self.node_table)) + 1):
            if self.browser.find_element(By.XPATH, f"//tbody/tr[{i}]/td[1]").text == str(node_id):
                self.browser.find_element(By.XPATH, f"//tbody/tr[{i}]/td[6]/span[1]/i").click()
                WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.ipv4))

    def add_config_input(self, ipv4, gw4, ipv6, gw6, domain):
        if ipv4:
            self.browser.find_element(*self.ipv4).clear()
            self.browser.find_element(*self.ipv4).send_keys(ipv4)
        if gw4:
            self.browser.find_element(*self.ipv4_gateway).clear()
            self.browser.find_element(*self.ipv4_gateway).send_keys(gw4)
        if ipv6:
            self.browser.find_element(*self.ipv6).clear()
            self.browser.find_element(*self.ipv6).send_keys(ipv6)
        if gw6:
            self.browser.find_element(*self.ipv6_gateway).clear()
            self.browser.find_element(*self.ipv6_gateway).send_keys(gw6)
        if domain:
            self.browser.find_element(*self.domain).clear()
            self.browser.find_element(*self.domain).send_keys(domain)
        return self.browser.find_element(*self.save)

    def remove_config(self):
        WebDriverWait(self.browser, 30).until(EC.element_to_be_clickable(self.remove)).click()
        WebDriverWait(self.browser, 30).until(EC.element_to_be_clickable(self.submit)).click()

    def setup_fee(self, node_id):
        for i in range(1, len(self.browser.find_elements(*self.node_table)) + 1):
            if self.browser.find_element(By.XPATH, f"//tbody/tr[{i}]/td[1]").text == str(node_id):
                self.browser.find_element(By.XPATH, f"//tbody/tr[{i}]/td[6]/span[2]/i").click()
                WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.fee_input))

    def set_fee(self, fee):
        self.browser.find_element(*self.fee_input).clear()
        self.browser.find_element(*self.fee_input).send_keys(fee)
        return self.browser.find_element(*self.set_btn)