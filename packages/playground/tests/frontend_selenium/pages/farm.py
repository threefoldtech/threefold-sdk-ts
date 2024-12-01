from time import sleep
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class FarmPage:

    """
    This module contains Your Farms page elements.
    """

    logout_button = (By.XPATH, "//button[.//span[text()=' Logout ']]")
    farm_section = (By.XPATH, "//span[text()='Farms']")
    farm_page = (By.XPATH, "//span[text()='Your Farms']")
    twin_details = (By.XPATH, "//*[contains(text(), 'Twin Details')]")
    create_button = (By.XPATH, "//button[.//span[text()='Create Farm']]")
    farm_name_text_field = (By.XPATH, "//label[text()='Farm name']/following-sibling::input")
    create_farm_button = (By.XPATH, "//button[.//span[text()='Create']]")
    search_bar=(By.XPATH, "//label[text()='Search farm by ID or farm name']/following-sibling::input")
    table = (By.XPATH, "//span[text()='Farm Name']/ancestor::table")
    details_arrow = (By.XPATH, '//table/tbody/tr/td[5]/button')
    farm_Id_arrow = (By.XPATH ,'//*[@id="app"]/div[1]/div[2]/div/div[1]/div[4]/div[1]/table/thead/tr/th[2]')
    farm_name_arrow = (By.XPATH ,'//*[@id="app"]/div[1]/div[2]/div/div[1]/div[4]/div[1]/table/thead/tr/th[3]/i')
    farm_twin_linked_arrow = (By.XPATH ,'//*[@id="app"]/div[1]/div[2]/div/div[1]/div[4]/div[1]/table/thead/tr/th[4]/i')
    certification_type_arrow = (By.XPATH ,'//*[@id="app"]/div[1]/div[2]/div/div[1]/div[4]/div[1]/table/thead/tr/th[5]/i')
    pricing_policy_arrow = (By.XPATH ,'//*[@id="app"]/div[1]/div[2]/div/div[1]/div[4]/div[1]/table/thead/tr/th[6]/i')
    add_v2_button = (By.XPATH, "//button[.//span[text()=' Add/Edit Stellar Payout Address ']]")
    submit_button = (By.XPATH, "//button[.//span[text()='Submit']]")
    view_bootstrap_button = (By.XPATH, "//a[.//span[text()='Bootstrap Node Image']]")
    add_ip_button = (By.XPATH, "//button[.//span[text()='Add IP']]")
    ip_text_field = (By.XPATH, "//label[text()='IP']/following-sibling::input")
    add_stellar_address = (By.XPATH, "//label[text()='Stellar Wallet Address']/following-sibling::input")
    gateway_text_field = (By.XPATH, "//label[text()='Gateway']/following-sibling::input")
    save_button = (By.XPATH, "//button[.//span[text()='Add']]")
    close_button = (By.XPATH, "//button[.//span[text()='Close']]")
    delete_button = (By.XPATH, "//button[.//span[text()=' Delete ']]")
    confirm_button = (By.XPATH, "//button[.//span[text()='Delete']]")
    zero = (By.XPATH,'//html/body/main/div[1]/div/h1')
    table_farm_name=(By.XPATH, '//*[@id="app"]/div[1]/div[2]/div/div[1]/div[4]/div[1]/table/tbody/tr[1]/td[3]')
    stellar_payout_address = (By.XPATH, '//table/tbody/tr[2]/td/div[1]/div/div/div[3]/div/div/div[1]/div[2]/p')
    dedicated = (By.XPATH, '//table/tbody/tr[2]/td/div[1]/div/div/div[3]/div/div/div[2]/div[2]/p')
    pricing_policy = (By.XPATH, '//table/tbody/tr[2]/td/div[1]/div/div/div[3]/div/div/div[3]/div[2]/p')
    ip_dropdown = (By.XPATH, "(//i[contains(@class, 'mdi-menu-down')])[3]")
    range_selection = (By.XPATH, "//div[@class='v-list-item-title'][text()='Range']")
    from_ip_input = (By.XPATH, "//label[text()='From IP']/following-sibling::input") 
    to_ip_input = (By.XPATH, "//label[text()='To IP']/following-sibling::input")
    table_row = '//*[@id="app"]/div[1]/div[2]/div/div[1]/div[4]/div[1]/table/tbody/tr['
    farm_public_ips = '//table/tbody/tr[2]/td/div[2]/div/div[1]/div/div[2]/table/tbody/tr'
    node_expand_details = '//table/tbody/tr[1]/td'
    rows_per_page = (By.XPATH, '//*[@id="app"]/div[1]/div[2]/div/div[1]/div[4]/div[2]/div[1]/div/div/div/div[1]/div[2]/div/i')
    all_rows_per_page = (By.XPATH, '/html/body/div[1]/div[3]/div/div[4]/div/div')   
    close_login_button = (By.XPATH, '/html/body/div[1]/div[3]/div/div/div[4]/button[2]')


    def __init__(self, browser):
        self.browser = browser

    def navigetor(self):
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.logout_button))
        webdriver.ActionChains(self.browser).send_keys(Keys.ESCAPE).perform()
        self.browser.find_element(*self.farm_section).click()
        self.browser.find_element(*self.farm_page).click()
    
    def check_farm_counts(self):
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.table_farm_name))
        table = self.browser.find_elements(*self.table)
        return len(table)

    def create_farm(self, farm_name):
        self.browser.find_element(*self.create_button).click()
        self.browser.find_element(*self.farm_name_text_field).send_keys(farm_name)
        self.browser.find_element(*self.create_farm_button).click()

    def create_farm_invalid_name(self, data):
        self.browser.find_element(*self.farm_name_text_field).send_keys(Keys.CONTROL + "a")
        self.browser.find_element(*self.farm_name_text_field).send_keys(Keys.DELETE)
        for char in data:
            self.browser.find_element(*self.farm_name_text_field).send_keys(char)

    def search_functionality(self, farm_name):
        tries = 3
        table = 'No data available'
        while('No data available' in table and tries > 0):
            sleep(5)
            self.browser.find_element(*self.search_bar).send_keys(Keys.CONTROL + "a")
            self.browser.find_element(*self.search_bar).send_keys(Keys.DELETE)
            for char in farm_name:
                self.browser.find_element(*self.search_bar).send_keys(char)
            table = self.browser.find_element(*self.table).text
            tries -= 1
            sleep(5)
            if table.count('NotCertified')>1:
                continue
            if farm_name in table:
                break
        return table
    
    def search_functionality_invalid_name(self, farm_name):
        # sleep(2)
        # self.browser.find_element(*self.search_bar).send_keys(Keys.CONTROL + "a")
        # self.browser.find_element(*self.search_bar).send_keys(Keys.DELETE)
        # for char in farm_name:
        #     self.browser.find_element(*self.search_bar).send_keys(char)
        # table = self.browser.find_element(*self.table).text
        # sleep(3)
        # return table
        self.wait_until_visible(self.search_bar)
        self.browser.find_element(*self.search_bar).clear()
        self.browser.find_element(*self.search_bar).send_keys(farm_name)
        WebDriverWait(self.browser, 30).until(
            lambda driver: "No data available" in driver.find_element(*self.table).text or farm_name in driver.find_element(*self.table).text
        )
        return self.browser.find_element(*self.table).text

    def display_all_farms(self):
        self.browser.execute_script("window.scrollTo(0,document.body.scrollHeight)")
        self.browser.find_element(*self.rows_per_page).click()
        self.browser.find_element(*self.all_rows_per_page).click()

    def farm_table_sorting_by_id(self):
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.table_farm_name))
        id=[]
        table = self.browser.find_elements(*self.table)
        for i in range(1,len(table)+1):
            element=(self.browser.find_element(By.XPATH, f"{self.table_row}{str(i)}]/td[2]").text)
            id.append(int(element))
        id.sort()
        self.browser.find_element(*self.farm_Id_arrow).click()
        sorted=[]
        table = self.browser.find_elements(*self.table)
        for i in range (1,len(table)+1):
            index=(self.browser.find_element(By.XPATH, f"{self.table_row}{str(i)}]/td[2]").text)
            sorted.append(int(index))
        return id,sorted,table
    
    def farm_table_sorting_by_id_up(self,id,rows):    
        id.reverse()
        sorted=[]
        self.browser.find_element(*self.farm_Id_arrow).click()
        for i in range (1,len(rows)+1):
            index1=(self.browser.find_element(By.XPATH, f"{self.table_row}{str(i)}]/td[2]").text)
            sorted.append(int(index1))
        return id,sorted

    def farm_table_sorting_by_name(self):
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.table_farm_name))      
        name=[]
        table = self.browser.find_elements(*self.table)
        for i in range(1,len(table)+1):                                                                                       
            element=(self.browser.find_element(By.XPATH, f"{self.table_row}{str(i)}]/td[3]").text)
            element=element.upper()
            name.append((element))
        name.sort()
        self.browser.find_element(*self.farm_name_arrow).click()
        sorted=[]
        for i in range (1,len(table)+1):
            index=(self.browser.find_element(By.XPATH, f"{self.table_row}{str(i)}]/td[3]").text)
            index=index.upper()
            sorted.append((index))
        return name,sorted,table

    def farm_sorting_name_up(self,name,table):  
        name.reverse()
        sorted=[]
        self.browser.find_element(*self.farm_name_arrow).click()
        for i in range (1,len(table)+1):
            index1=(self.browser.find_element(By.XPATH, f"{self.table_row}{str(i)}]/td[3]").text)
            index1=index1.upper()
            sorted.append((index1))
        return name,sorted

    def farm_table_sorting_by_twin_id(self):
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.table_farm_name)) 
        id=[]
        table = self.browser.find_elements(*self.table)
        for i in range(1,len(table)+1):                                                                                       
            element=(self.browser.find_element(By.XPATH, f"{self.table_row}{str(i)}]/td[4]").text)
            id.append(int(element))
        id.sort()
        self.browser.find_element(*self.farm_twin_linked_arrow).click()
        sorted=[]
        for i in range (1,len(table)+1):
            index=(self.browser.find_element(By.XPATH, f"{self.table_row}{str(i)}]/td[4]").text)
            sorted.append(int(index))
        return id,sorted,table   
    
    def farm_table_sorting_by_twin_id_up(self,id,table):
        id.reverse()
        sorted=[]
        self.browser.find_element(*self.farm_twin_linked_arrow).click()
        for i in range (1,len(table)+1):
            index1=(self.browser.find_element(By.XPATH, f"{self.table_row}{str(i)}]/td[4]").text)
            sorted.append(int(index1))
        return id , sorted
      
    def farm_table_sorting_by_cerification_type(self):
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.table_farm_name))
        name=[]
        table = self.browser.find_elements(*self.table)
        for i in range(1,len(table)+1):                                                                                       
            element=(self.browser.find_element(By.XPATH, f"{self.table_row}{str(i)}]/td[5]").text)
            name.append((element))
        name.sort()
        self.browser.find_element(*self.certification_type_arrow).click()
        sorted=[]
        for i in range (1,len(table)+1):
            index=(self.browser.find_element(By.XPATH, f"{self.table_row}{str(i)}]/td[5]").text)
            sorted.append((index))
        return name ,sorted,table   

    def  farm_table_sorting_by_cerification_type_up(self,name,table): 
        name.reverse()
        sorted=[]
        for i in range (1,len(table)+1):
            index1=(self.browser.find_element(By.XPATH, f"{self.table_row}{str(i)}]/td[5]").text)
            sorted.append((index1))
        return name,sorted

    def farm_table_sorting_by_pp_id(self):
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.table_farm_name))      
        id=[]
        table = self.browser.find_elements(*self.table)
        for i in range(1,len(table)+1):                                                                                       
            element=(self.browser.find_element(By.XPATH, f"{self.table_row}{str(i)}]/td[6]").text)
            id.append(int(element))
        id.sort()
        self.browser.find_element(*self.pricing_policy_arrow).click()
        sorted=[]
        for i in range (1,len(table)+1):
            index=(self.browser.find_element(By.XPATH, f"{self.table_row}{str(i)}]/td[6]").text)
            sorted.append(int(index))
        return id,sorted,table

    def farm_table_sorting_by_pp_id_up(self,id,table):  
        id.reverse()
        sorted=[]
        self.browser.find_element(*self.pricing_policy_arrow).click()
        for i in range (1,len(table)+1):
            index1=(self.browser.find_element(By.XPATH, f"{self.table_row}{str(i)}]/td[6]").text)
            sorted.append(int(index1))
        return id, sorted

    def setup_farmpayout_address(self, farm_name):
        self.search_functionality(farm_name)
        self.wait_for_farm_name(farm_name)
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.details_arrow))
        WebDriverWait(self.browser, 30).until(EC.element_to_be_clickable(self.details_arrow))
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located((By.XPATH, "//span[contains(@class, 'v-btn__content')]/i[contains(@class, 'mdi-chevron-down')]")))
        self.browser.find_element(*self.details_arrow).click()
        if(len(self.browser.find_elements(By.XPATH, "//span[contains(@class, 'v-btn__content')]/i[contains(@class, 'mdi-chevron-up')]")) == 0):
            self.browser.find_element(*self.details_arrow).click()
        webdriver.ActionChains(self.browser).send_keys(Keys.PAGE_DOWN).perform()
        sleep(10)

    def reopen_details(self):
        WebDriverWait(self.browser, 60).until(EC.visibility_of_element_located((By.XPATH, "//span[contains(@class, 'v-btn__content')]/i[contains(@class, 'mdi-chevron-down')]")))
        self.browser.find_element(*self.details_arrow).click()
        self.browser.execute_script("window.scrollBy(0, 150);")
    
    def add_farmpayout_address(self, data):
        self.browser.find_element(*self.add_stellar_address).send_keys(Keys.CONTROL + "a")
        self.browser.find_element(*self.add_stellar_address).send_keys(Keys.DELETE)
        self.browser.find_element(*self.add_stellar_address).send_keys(data)
        return self.browser.find_element(*self.submit_button)

    def farmpayout_address_value(self):
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located(self.stellar_payout_address))
        return self.browser.find_element(*self.stellar_payout_address).text
    
    def setup_gateway(self, ip, gateway, farm_name, open_dialogue):
        if (open_dialogue):
            self.setup_farmpayout_address(farm_name)
        self.browser.find_element(*self.add_ip_button).click()
        self.add_ip(ip)
        self.add_gateway(gateway)

    def add_ip(self, data):
        self.browser.find_element(*self.ip_text_field).send_keys(Keys.CONTROL + "a")
        self.browser.find_element(*self.ip_text_field).send_keys(Keys.DELETE)
        self.browser.find_element(*self.ip_text_field).send_keys(data) 
        return self.browser.find_element(*self.save_button)

    def setup_ip(self, data, farm_name):
        self.browser.execute_script("window.scrollTo(0,0)")
        self.setup_farmpayout_address(farm_name)
        WebDriverWait(self.browser, 30).until(EC.element_to_be_clickable(self.add_ip_button))
        self.browser.find_element(*self.add_ip_button).click()
        self.add_ip(data)

    def add_gateway(self, data):
        self.browser.find_element(*self.gateway_text_field).send_keys(Keys.CONTROL + "a")
        self.browser.find_element(*self.gateway_text_field).send_keys(Keys.DELETE)
        self.browser.find_element(*self.gateway_text_field).send_keys(data) 
        return self.browser.find_element(*self.save_button)

    def change_to_range_ip(self, farm_name):
        self.setup_farmpayout_address(farm_name)
        self.browser.find_element(*self.add_ip_button).click()
        WebDriverWait(self.browser, 30).until(EC.element_to_be_clickable(self.ip_dropdown))
        self.browser.find_element(*self.ip_dropdown).click()
        WebDriverWait(self.browser, 30).until(EC.element_to_be_clickable(self.range_selection))
        self.browser.find_element(*self.range_selection).click()
    
    def add_range_ips(self, from_ip, to_ip, range_gateway):
        if(from_ip):
            self.browser.find_element(*self.from_ip_input).send_keys(Keys.CONTROL + "a")
            self.browser.find_element(*self.from_ip_input).send_keys(Keys.DELETE)
            self.browser.find_element(*self.from_ip_input).send_keys(from_ip) 
        if(to_ip):
            self.browser.find_element(*self.to_ip_input).send_keys(Keys.CONTROL + "a")
            self.browser.find_element(*self.to_ip_input).send_keys(Keys.DELETE)
            self.browser.find_element(*self.to_ip_input).send_keys(to_ip) 
        if(range_gateway):
            self.browser.find_element(*self.gateway_text_field).send_keys(Keys.CONTROL + "a")
            self.browser.find_element(*self.gateway_text_field).send_keys(Keys.DELETE)
            self.browser.find_element(*self.gateway_text_field).send_keys(range_gateway)
        return self.browser.find_element(*self.save_button)

    def delete_ip(self, farm_name, ip, gateway):
        self.setup_farmpayout_address(farm_name)
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located((By.XPATH, self.farm_public_ips)))
        for i in range(len(self.browser.find_elements(By.XPATH, self.farm_public_ips))):
           if(self.browser.find_element(By.XPATH,  f"{self.farm_public_ips}[{str(i+1)}]/td[2]").text == ip):
                if(self.browser.find_element(By.XPATH,  f"{self.farm_public_ips}[{str(i+1)}]/td[3]").text == gateway):
                    #WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located((By.XPATH,  f"{self.farm_public_ips}[{str(i+1)}]/td[1]/div/div/div/div/div/input")))
                    self.browser.find_element(By.XPATH,  f"{self.farm_public_ips}[{str(i+1)}]/td[1]/div/div/div/div/div/input").click()
                    WebDriverWait(self.browser, 30).until(EC.element_to_be_clickable(self.delete_button))
                    self.browser.find_element(*self.delete_button).click()
                    WebDriverWait(self.browser, 30).until(EC.element_to_be_clickable(self.confirm_button))
                    self.browser.find_element(*self.confirm_button).click()

    def get_ip(self, ip, gateway):
        ip_len = 0
        gateway_len = 0
        if(ip):
            ip_len = len(self.browser.find_elements(By.XPATH, "//td[contains(@class, 'v-data-table__td') and contains(@class, 'v-data-table-column--align-center') and text()='"+ ip +"']"))
        if(gateway):
            gateway_len = len(self.browser.find_elements(By.XPATH, "//td[contains(@class, 'v-data-table__td') and contains(@class, 'v-data-table-column--align-center') and text()='"+ gateway +"']"))
        return ip_len, gateway_len
    
    def farm_detials(self):
        details = []
        details.append(self.browser.find_element(By.XPATH,  f"{self.node_expand_details}[1]").text) # Farm ID
        details.append(self.browser.find_element(By.XPATH,  f"{self.node_expand_details}[2]").text) # Farm Name
        details.append(self.browser.find_element(By.XPATH,  f"{self.node_expand_details}[3]").text) # Linked Twin ID
        details.append(self.browser.find_element(By.XPATH,  f"{self.node_expand_details}[4]").text) # Certification Type
        details.append(self.browser.find_element(*self.stellar_payout_address).text) # Stellar Address
        details.append(True if self.browser.find_element(*self.dedicated).text != "No" else False) # Dedicated
        details.append(self.browser.find_element(*self.pricing_policy).text) # Pricing Policy
        for i in range(len(self.browser.find_elements(By.XPATH, self.farm_public_ips))):
            details.append(self.browser.find_element(By.XPATH,  f"{self.farm_public_ips}[{str(i+1)}]/td[2]").text) # IP
            details.append(self.browser.find_element(By.XPATH,  f"{self.farm_public_ips}[{str(i+1)}]/td[4]").text) # Deployed Contract ID
            details.append(self.browser.find_element(By.XPATH,  f"{self.farm_public_ips}[{str(i+1)}]/td[3]").text) # Gateway
        return details

    def verify_the_availability_of_zero_os_bootstrap(self):
        self.browser.find_element(*self.view_bootstrap_button).click()
        WebDriverWait(self.browser, 30).until(EC.number_of_windows_to_be(2))
        self.browser.switch_to.window(self.browser.window_handles[1])
        site = self.browser.current_url
        self.browser.close()
        self.browser.switch_to.window(self.browser.window_handles[0])
        return site
        
    def open_create(self):
        self.browser.find_element(*self.create_button).click()

    def close_ip(self):
        self.browser.find_element(*self.close_button).click()
        
    def close_detail(self):
        self.browser.find_element(*self.details_arrow).click()

    def wait_for_farm_name(self, keyword):
        td_elements = self.browser.find_elements(By.XPATH, "//table[1]//tbody//tr")
        td_texts = [td.text for td in td_elements]
        return keyword in td_texts[0]

    def wait_for_button(self, button):
        WebDriverWait(self.browser, 30).until(EC.element_to_be_clickable(button))
        return button

    def wait_for(self, keyword):
        WebDriverWait(self.browser, 30).until(EC.visibility_of_element_located((By.XPATH, "//*[contains(text(), '"+ keyword +"')]")))
        return True
