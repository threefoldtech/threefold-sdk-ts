from selenium import webdriver
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
    twin_details_label = (By.XPATH, "//*[contains(text(), 'Twin Details')]")
    farm_section = (By.XPATH, "//span[text()='Farms']")
    farm_page = (By.XPATH, "//span[text()='Your Farms']")
    node_page = (By.XPATH , "//*[contains(text(), 'Your Nodes')]")
    search_node_input = (By.XPATH, '/html/body/div[1]/div[1]/div[3]/div/div/div[5]/div/div[1]/div/div[1]/div/input')
    node_table = (By.XPATH, "//span[text()='Node ID']/ancestor::table/tbody/tr")
    node_id = (By.XPATH , "//*[contains(text(), 'Node ID')]")
    farm_id = (By.XPATH , '//*[@id="app"]/div[1]/div[2]/div/div[1]/div[5]/div[2]/div[1]/div[1]/table/thead/tr/th[3]')
    country = (By.XPATH , "//*[contains(text(), 'Country')]")
    serial_number = (By.XPATH , "//*[contains(text(), 'Serial Number')]")
    status = (By.XPATH , "//*[contains(text(), 'Status')]")
    id_label = (By.XPATH , "//*[contains(text(), 'Add a public config to your node with ID:')]")
    update_msg = (By.XPATH , "//*[contains(text(), 'Are you sure you want to remove this node')]")
    ipv4 = (By.XPATH, "//label[text()='IPv4']/following-sibling::input")
    ipv4_gateway = (By.XPATH, "//label[text()='Gateway IPv4']/following-sibling::input")
    ipv6 = (By.XPATH, "//label[text()='IPv6']/following-sibling::input")
    ipv6_gateway = (By.XPATH, "//label[text()='Gateway IPv6']/following-sibling::input")
    domain = (By.XPATH, "//label[text()='Domain']/following-sibling::input")
    remove = (By.XPATH, "//button[.//span[text()=' Remove Config ']]")
    cancel = (By.XPATH, "//button[.//span[text()='Close']]")
    save = (By.XPATH, "//button[.//span[text()=' Save ']]")
    submit = (By.XPATH, "//button[.//span[text()='Remove']]")
    fee_input = (By.XPATH, "//label[text()='Additional Fees']/following-sibling::input")
    set_btn = (By.XPATH, "//button[.//span[text()='Save']]")
    fee_id = (By.XPATH , "//*[contains(text(), 'Additional fees will be added to your node')]")
    table_xpath = "//span[text()='Node ID']/ancestor::table/tbody/tr"


    def __init__(self, browser):
        self.browser = browser
      
    def navigate(self):
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.logout_button))
        webdriver.ActionChains(self.browser).send_keys(Keys.ESCAPE).perform()
        self.browser.find_element(*self.tfchain_button).click()
        self.browser.find_element(*self.your_profile_button).click()
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.twin_details_label))
        self.twin_id = self.browser.find_element(*self.twin_id_label).text
        self.browser.find_element(*self.farm_section).click()
        self.browser.find_element(*self.farm_page).click()
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.node_page))
    
    def search_nodes(self, node):
        self.browser.find_element(*self.search_node_input).send_keys(Keys.CONTROL + "a")
        self.browser.find_element(*self.search_node_input).send_keys(Keys.DELETE)
        self.browser.find_element(*self.search_node_input).send_keys(node)
    
    def get_node_count(self):
        return len(self.browser.find_elements(*self.node_table))
    
    def get_node_id(self, node_list):
        ids = []
        for node in node_list:
            ids.append(node['nodeId']) 
        return ids
    
    def get_farm_id(self, node_list):
        ids = []
        for node in node_list:
            ids.append(node['farmId']) 
        return ids
    
    def get_country(self, node_list):
        country = []
        for node in node_list:
            country.append(node['country']) 
        return country
    
    def get_serial_number(self, node_list):
        numbers = []
        for node in node_list:
            numbers.append(node['serialNumber']) 
        return numbers
    
    def get_status(self, node_list):
        status = []
        for node in node_list:
            status.append(node['status']) 
        return status

    def sort_node_id(self):
        self.browser.find_element(*self.node_id).click()
        node_id = []
        for i in range(1, len(self.browser.find_elements(*self.node_table))+1):
            node_id.append(int(self.browser.find_element(By.XPATH, f"{self.table_xpath}[{str(i)}]/td[2]").text))
        return node_id

    def sort_farm_id(self):
        self.browser.find_element(*self.farm_id).click()
        farm_id = []
        for i in range(1, len(self.browser.find_elements(*self.node_table))+1):
            farm_id.append(int(self.browser.find_element(By.XPATH, f"{self.table_xpath}[{str(i)}]/td[3]").text))
        return farm_id

    def sort_country(self):
        self.browser.find_element(*self.country).click()
        country = []
        for i in range(1, len(self.browser.find_elements(*self.node_table))+1):
            country.append(self.browser.find_element(By.XPATH, f"{self.table_xpath}[{str(i)}]/td[4]").text)
        return country

    def sort_serial_number(self):
        self.browser.find_element(*self.serial_number).click()
        serial_number = []
        for i in range(1, len(self.browser.find_elements(*self.node_table))+1):
            serial_number.append(self.browser.find_element(By.XPATH, f"{self.table_xpath}[{str(i)}]/td[5]").text)
        return serial_number

    def sort_status(self):
        self.browser.find_element(*self.status).click()
        status = []
        for i in range(1, len(self.browser.find_elements(*self.node_table))+1):
            status.append(self.browser.find_element(By.XPATH, f"{self.table_xpath}[{str(i)}]/td[6]").text)
        return status
    
    def node_details(self):
        self.browser.find_element(*self.node_id).click()
        nodes = []
        for i in range(1, len(self.browser.find_elements(*self.node_table))+1):
            self.browser.execute_script("window.scrollTo(0,document.body.scrollHeight)")
            self.browser.find_element(By.XPATH, self.table_xpath+ '['+ str(i) +']/td[7]/button').click()
            details = []
            WebDriverWait(self.browser, 30).until(EC.element_to_be_clickable((By.XPATH, self.table_xpath+ '['+ str(i) +']/td[6]/span[1]/i')))
            self.browser.find_element(By.XPATH, self.table_xpath+ '['+ str(i) +']/td[6]/span[1]/i').click()
            WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.id_label))
            details.append(self.browser.find_element(*self.id_label).text[42:]) # ID
            details.append(self.browser.find_element(*self.ipv4).get_attribute("value")) # IPV4
            details.append(self.browser.find_element(*self.ipv4_gateway).get_attribute("value")) # IPV4 Gateway
            details.append(self.browser.find_element(*self.ipv6).get_attribute("value")) # IPV6
            details.append(self.browser.find_element(*self.ipv6_gateway).get_attribute("value")) # IPV6 Gateway
            details.append(self.browser.find_element(*self.domain).get_attribute("value")) # Domain
            self.browser.find_element(*self.cancel).click()
            self.browser.execute_script("window.scrollTo(0,document.body.scrollHeight)")
            self.browser.find_element(By.XPATH, self.table_xpath+ '['+ str(i) +']/td[7]/button').click()
            details.append(int(self.browser.find_element(By.XPATH, f"{self.table_xpath}[{str(i+1)}]/td/div[1]/div[3]/div/div/div[1]/div[2]/p").text)) # Node ID
            details.append(int(self.browser.find_element(By.XPATH, f"{self.table_xpath}[{str(i+1)}]/td/div[1]/div[3]/div/div/div[2]/div[2]/p").text)) # Farm ID
            details.append(int(self.browser.find_element(By.XPATH, f"{self.table_xpath}[{str(i+1)}]/td/div[1]/div[3]/div/div/div[3]/div[2]/p").text)) # Twin ID
            details.append(self.browser.find_element(By.XPATH, f"{self.table_xpath}[{str(i+1)}]/td/div[1]/div[3]/div/div/div[7]/div[2]/p").text) # Country
            details.append(self.browser.find_element(By.XPATH, f"{self.table_xpath}[{str(i+1)}]/td/div[1]/div[3]/div/div/div[8]/div[2]/p").text) # City
            details.append(self.browser.find_element(By.XPATH, f"{self.table_xpath}[{str(i+1)}]/td/div[1]/div[3]/div/div/div[5]/div[2]/p").text) # First Boot at
            details.append(int(self.browser.find_element(By.XPATH, f"{self.table_xpath}[{str(i+1)}]/td/div[1]/div[3]/div/div/div[10]/div[2]/p").text)) # Pricing Policy
            details.append(self.browser.find_element(By.XPATH, f"{self.table_xpath}[{str(i+1)}]/td/div[1]/div[3]/div/div/div[6]/div[2]/p").text) # Updated at
            details.append(float(self.browser.find_element(By.XPATH, f"{self.table_xpath}[{str(i+1)}]/td/div[2]/div[3]/div/div[1]/div[2]/div/div").text[:-1])) # CRU
            details.append(float(self.browser.find_element(By.XPATH, f"{self.table_xpath}[{str(i+1)}]/td/div[2]/div[3]/div/div[3]/div[2]/div/div").text[:-1])) # SRU
            details.append(float(self.browser.find_element(By.XPATH, f"{self.table_xpath}[{str(i+1)}]/td/div[2]/div[3]/div/div[4]/div[2]/div/div").text[:-1])) # HRU
            details.append(float(self.browser.find_element(By.XPATH, f"{self.table_xpath}[{str(i+1)}]/td/div[2]/div[3]/div/div[2]/div[2]/div/div").text[:-1])) # MRU
            details.append(self.browser.find_element(By.XPATH, f"{self.table_xpath}[{str(i)}]/td[5]/span/div").text) # Status
            details.append(self.browser.find_element(By.XPATH, f"{self.table_xpath}[{str(i+1)}]/td/div[1]/div[3]/div/div/div[4]/div[2]/p").text) # Certification
            details.append(self.browser.find_element(By.XPATH, f"{self.table_xpath}[{str(i+1)}]/td/div[1]/div[3]/div/div/div[9]/div[2]/p").text) # Serial Number
            details.append(float(self.browser.find_element(By.XPATH, f"{self.table_xpath}[{str(i+1)}]/td/div[1]/div[3]/div/div/div[11]/div[2]/p").text[:-1])) # Uptime
            nodes.append(details)
        return nodes
    
def setup_config(self, node_id):
    """
    Prepares the setup configuration for a given node ID.
    """
    for i in range(1, len(self.browser.find_elements(*self.node_table)) + 1):
        if self.browser.find_element(By.XPATH, f"{self.table_xpath}[{i}]/td[1]").text == str(node_id):
            elem = self.browser.find_element(By.XPATH, f"{self.table_xpath}[{i}]/td[6]/span[1]/i")
            self.browser.execute_script("arguments[0].scrollIntoView(true);", elem)
            WebDriverWait(self.browser, 30).until(EC.element_to_be_clickable(elem)).click()
            WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.id_label))
    def add_config_input(self, ipv4, gw4, ipv6, gw6, domain):
        if(ipv4):
            self.browser.find_element(*self.ipv4).send_keys(Keys.CONTROL + "a")
            self.browser.find_element(*self.ipv4).send_keys(Keys.DELETE)
            self.browser.find_element(*self.ipv4).send_keys(ipv4)
        if(gw4):
            self.browser.find_element(*self.ipv4_gateway).send_keys(Keys.CONTROL + "a")
            self.browser.find_element(*self.ipv4_gateway).send_keys(Keys.DELETE)
            self.browser.find_element(*self.ipv4_gateway).send_keys(gw4)
        if(ipv6):
            self.browser.find_element(*self.ipv6).send_keys(Keys.CONTROL + "a")
            self.browser.find_element(*self.ipv6).send_keys(Keys.DELETE)
            self.browser.find_element(*self.ipv6).send_keys(ipv6)
        if(gw6):
            self.browser.find_element(*self.ipv6_gateway).send_keys(Keys.CONTROL + "a")
            self.browser.find_element(*self.ipv6_gateway).send_keys(Keys.DELETE)
            self.browser.find_element(*self.ipv6_gateway).send_keys(gw6)
        if(domain):
            self.browser.find_element(*self.domain).send_keys(Keys.CONTROL + "a")
            self.browser.find_element(*self.domain).send_keys(domain)
        return self.browser.find_element(*self.save)

    def get_save_button(self):
        return self.browser.find_element(*self.save)

    def remove_config(self):
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.remove))
        WebDriverWait(self.browser, 30).until(EC.element_to_be_clickable(self.remove))
        self.browser.find_element(*self.remove).click()
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.update_msg))
        WebDriverWait(self.browser, 30).until(EC.element_to_be_clickable(self.submit))
        self.browser.find_element(*self.submit).click()
    
    def setup_fee(self, node_id):
        for i in range(1, len(self.browser.find_elements(*self.node_table))+1):
            if (self.browser.find_element(By.XPATH, f"{self.table_xpath}[{str(i)}]/td[1]").text==str(node_id)):
                self.browser.find_element(By.XPATH, self.table_xpath+ '['+ str(i) +']/td[6]/span[2]/i').click()
                WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.fee_id))

    def set_fee(self, fee):
        self.browser.find_element(*self.fee_input).send_keys(Keys.CONTROL + "a")
        self.browser.find_element(*self.fee_input).send_keys(Keys.DELETE)
        self.browser.find_element(*self.fee_input).send_keys(fee)
        return self.browser.find_element(*self.set_btn)
    
    def get_fee_button(self):
        return self.browser.find_element(*self.set_btn)

def wait_for(self, keyword):
    """
    Waits for an element with specific text to be visible on the page.
    """
    try:
        WebDriverWait(self.browser, 60).until(
            EC.visibility_of_element_located((By.XPATH, f"//*[contains(text(), '{keyword}')]"))
        )
    except TimeoutException:
        print(f"Timeout waiting for keyword: {keyword}")
        raise
    return True


def wait_for_button(self, button):
    """
    Waits for a button to be clickable.
    """
    try:
        WebDriverWait(self.browser, 60).until(EC.element_to_be_clickable(button))
    except TimeoutException:
        print("Timeout waiting for button to be clickable.")
        raise
    return button
