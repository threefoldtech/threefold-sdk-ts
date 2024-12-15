from utils.utils import generate_gateway, generate_inavalid_gateway, generate_inavalid_ip, generate_ip, increment_ip, generate_gateway_from_ip, generate_string, get_seed, get_email, randomize_public_ipv4
from pages.farm import FarmPage
from utils.grid_proxy import GridProxy
from pages.dashboard import DashboardPage
import pytest

#  Time required for the run (17 cases) is approximately 13 minutes.

def before_test_setup(browser):
    farm_page = FarmPage(browser)
    dashboard_page = DashboardPage(browser)
    farm_name = 'F_' + generate_string()
    password = generate_string()
    dashboard_page.open_and_load()
    dashboard_page.import_account(get_seed())
    dashboard_page.click_button(dashboard_page.connect_your_wallet(get_email(), password))
    farm_page.navigetor()
    return farm_page, farm_name

@pytest.mark.skip(reason="https://github.com/threefoldtech/tfgrid-sdk-ts/issues/3676")
def test_create_farm(browser):
    """
    Test Case: TC907-Create farm with valid name
    Test Case: TC911-Create farm with existing name
    Test Case: TC908-Verify the search functionality
    Steps:
        - Navigate to the dashboard.
        - Login.
        - From the Twin Details Page Click on Farms.
        - In the Farms page Click on "Create Farm" button.
        - Enter the Farm Name.
        - Click on Submit.
        - Try to recreate a Farm with same name on the third step
        - In the Farms search bar enter the name or the id of the farm you just created
    Test Data: [ use the whole name of the farm, only the first part, the second part ]
    Result: The user can create a farm.
            You should see the bottom right alert with the message "farm creation failed".
            The search results should be displayed correctly according to the keywords used.
            You should see "No data available " on the table of farms.
    """
    farm_page, farm_name = before_test_setup(browser)
    table = farm_page.search_functionality_invalid_name(generate_string())
    assert 'No data available' in table
    farm_page.create_farm(farm_name)
    assert farm_page.wait_for('Farm created successfully')
    farm_page.search_functionality(farm_name)
    assert farm_page.wait_for_farm_name(farm_name)
    farm_page.open_create()
    farm_page.create_farm_invalid_name(farm_name)
    assert farm_page.wait_for('Farm name already exists!')


def test_create_farm_invalid_name(browser):
    """
    Test Case: TC912 - create a farm with invalid name
    Steps:
        - Navigate to the dashboard.
        - Login.
        - From the Twin Details Page Click on Farms.
        - In the Farms page Click on " Create Farm ".
        - Enter the Farm Name.
        - Click on Submit.
    Test Data: [Empty Field, More than 40 char, Spaces, Special chr(@,#%^&*(_+-))]
    Result: You should display a warning message 'Name is not formatted correctly (All letters + numbers and (-,_) are allowed).
    """
    farm_page, _ = before_test_setup(browser)
    farm_page.open_create()
    farm_page.create_farm_invalid_name('f f')
    assert farm_page.wait_for("Farm name should not contain whitespaces.")
    cases = ['f', 'DD', '4', '88', '-', '_-']
    for case in cases:
        farm_page.create_farm_invalid_name(case)
        assert farm_page.wait_for('Farm name minimum length is 3 chars')
    cases = [' ', '2ff', '88!', '#dd', '|~</;:']
    for case in cases:
        farm_page.create_farm_invalid_name(case)
        assert farm_page.wait_for("Farm name must start with an alphabet char.")
    cases = ['ddd#', 'ddd@', 'gg$', 'aa%', 'bb^', 'cc&', 'h8*', 's5()']
    for case in cases:
        farm_page.create_farm_invalid_name(case)
        assert farm_page.wait_for("Farm name can only contain alphabetic letters, numbers,")
    farm_page.create_farm_invalid_name('f'+generate_string()+generate_string()+'_'+generate_string()+generate_string())
    assert farm_page.wait_for('Farm name maximum length is 40 chars')


# def test_farm_table_sorting(browser):
#     """
#     Test Case: TC910 - Farm Node table sorting
#     Steps:
#         - Navigate to the dashboard.
#         - Login.
#         - From the Twin Details Page Click on Farms
#         - Make sure to have at least 2 Farms , If you don't create them
#         - Click on the arrow behind farm Id 'once up and once down and once to remove the sorting'
#         - Click on the arrow behind the farm Name 'once up and once down and once to remove the sorting'
#         - Click on the arrow behind the Linked twin id 'once up and once down and once to remove the sorting'
#         - Click on the arrow behind the Certification type 'once up and once down and once to remove the sorting'
#         - Click on the arrow behind the pricing policy id 'once up and once down and once to remove the sorting'
#     Result: You should see the sorting of the table change according to each case
#     """
#     farm_page, farm_name = before_test_setup(browser)
#     while (farm_page.check_farm_counts() < 2):
#         farm_page.create_farm(farm_name + generate_string())
#         assert farm_page.wait_for('Farm created!')
#         farm_page.search_functionality(farm_name)
#         assert farm_page.wait_for(farm_name)
#         farm_page.search_functionality("")
#     farm_page.display_all_farms()
#     #sort by ID
#     id,sorted,rows = farm_page.farm_table_sorting_by_id()
#     assert id == sorted
#     id_up,sorted_up = farm_page.farm_table_sorting_by_id_up(id,rows)
#     assert id_up == sorted_up
#     #sort by Name
#     name,sorted,table = farm_page.farm_table_sorting_by_name()
#     assert name == sorted
#     name_up,sorted_up = farm_page.farm_sorting_name_up(name,table)
#     assert name_up == sorted_up
#     #sort by Twin ID
#     id,sorted,table = farm_page.farm_table_sorting_by_twin_id()
#     assert id == sorted
#     id_up,sorted_up = farm_page.farm_table_sorting_by_twin_id_up(id,table)
#     assert id_up == sorted_up
#     #sort by Cerification Type
#     name ,sorted,table = farm_page.farm_table_sorting_by_cerification_type()
#     assert name == sorted
#     name_up,sorted_up = farm_page.farm_table_sorting_by_cerification_type_up(name,table)
#     assert name_up == sorted_up
#     #sort by Pricing Policy ID
#     id,sorted,table = farm_page.farm_table_sorting_by_pp_id()
#     assert id == sorted
#     id_up,sorted_up = farm_page.farm_table_sorting_by_pp_id_up(id,table)
#     assert id_up == sorted_up


@pytest.mark.skip(reason="https://github.com/threefoldtech/tfgrid-sdk-ts/issues/3676")
def test_farmpayout_address(browser):
    """
    Test Case: TC915 - Add farm payout address
    Test Case: TC1140 - Add invalid farm payout address
    Test Case: TC916 - Edit farm payout address
    Steps:
        - Navigate to the dashboard.
        - Login.
        - From the Twin Details Page Click on Farms
        - Make sure you have at least one farm.
        - Click on the arrow behind any farm id
        - Click on add v2 address button
        - Put the address
        - Click Submit
    Result: You should see the bottom right alert with the message "address added"
            You should see alert with the message "invalid address"
            You should see the bottom right alert with the message "address added"
    """
    farm_page, farm_name = before_test_setup(browser)
    farm_page.create_farm(farm_name)
    assert farm_page.wait_for('Farm created successfully')
    farm_page.search_functionality(farm_name)
    assert farm_page.wait_for_farm_name(farm_name)
    farm_page.search_functionality("")
    farm_page.setup_farmpayout_address(farm_name)
    farm_page.wait_for_button(browser.find_element(*farm_page.add_v2_button)).click()
    cases = [' ', 'dgdd', generate_string(), 'gdhjP6TF3UXYXTNEZ2P36J5FH7W4BJJQ4AYYAXC66I2Q2AH5B6O6Bcfg']
    for case in cases:
        assert farm_page.add_farmpayout_address(case).is_enabled()==False
    case = "GCD2U5ESLGBA46ZXDVXQWBKHH7SVEW7F55GDO3MVUNHJOBM5DK5QCALQ"
    farm_page.wait_for_button(farm_page.add_farmpayout_address(case)).click()
    assert farm_page.wait_for('This action will be reflected in a bit')
    assert farm_page.wait_for('Address Added successfully!')
    assert farm_page.farmpayout_address_value()[:-3] in case
    case = "GAK2AN6ZC4REV2GXZPTMJG2JKLRJQX746JNG7ACKNC4RSJE7ETAZSE7D"
    farm_page.wait_for_button(browser.find_element(*farm_page.add_v2_button)).click()
    farm_page.wait_for_button(farm_page.add_farmpayout_address(case)).click()
    assert farm_page.wait_for('This action will be reflected in a bit')
    assert farm_page.wait_for('Address Added successfully!')
    while (farm_page.farmpayout_address_value()[:-3] not in case):
        continue
    assert farm_page.farmpayout_address_value()[:-3] in case


@pytest.mark.skip(reason="https://github.com/threefoldtech/tfgrid-sdk-ts/issues/3676")
def test_ip(browser):
    """
    Test Case: TC1141 - Enter valid IP
    Test Case: TC919 - Enter Invalid IP
    Test Case: TC917 - Add IP to Farm
    Test Case: TC918 - Delete IP address from farm
    Steps:
        - Navigate to the dashboard.
        - Login.
        - From the Twin Details Page Click on Farms.
        - Make sure you have at least one farm.
        - Click on the arrow behind any farm id.
        - Click on Public IPs.
        - Click on add IP button.
        - Add ip and Gateway.
    Test Data for IP: [ should be numbers separated by '.' and end with '/' port ex: 127.0.0.01/16]
    Result: You should see the bottom right alert with the message "incorrect format".
            You should see the bottom right alert with the message "IP Created!"
            You should see the bottom right alert with the message "IP deleted!"
    """
    farm_page, farm_name = before_test_setup(browser)
    farm_page.create_farm(farm_name)
    assert farm_page.wait_for('Farm created successfully')
    farm_page.search_functionality(farm_name)
    assert farm_page.wait_for_farm_name(farm_name)
    farm_page.search_functionality("")
    cases = [generate_inavalid_ip(), '1.0.0.0/66', '239.255.255/17', '239.15.35.78.5/25', '239.15.35.78.5', ' ', '*.#.@.!|+-']
    farm_page.setup_gateway(generate_gateway()+'/16', generate_gateway(), farm_name, True)
    for case in cases:
        farm_page.add_ip(case)
        assert farm_page.wait_for('Not a valid IP')
        assert browser.find_element(*farm_page.save_button).is_enabled()==False
    farm_page.add_ip('255.0.0.1/32')
    assert farm_page.wait_for('IP is not public')
    assert browser.find_element(*farm_page.save_button).is_enabled()==False
    farm_page.close_ip()
    ip, gateway = randomize_public_ipv4()
    cases = [gateway, '2.0.0.1',  '3.0.0.0', '139.255.255.255', '59.15.35.78']
    for case in cases:
        farm_page.setup_gateway('125.25.25.25/16', case, farm_name, False)
        assert farm_page.wait_for('Gateway IP not in the provided IP range.')
        assert browser.find_element(*farm_page.save_button).is_enabled()==False
        farm_page.close_ip()
    farm_page.setup_gateway(gateway, gateway, farm_name, False)
    assert farm_page.wait_for('IPs cannot be the same.')
    farm_page.close_ip()
    regenerate = True
    while(regenerate):
        ip = generate_ip()
        gateway, regenerate = generate_gateway_from_ip(ip)
    farm_page.setup_ip(ip, farm_name)
    farm_page.wait_for_button(farm_page.add_gateway(gateway)).click()
    assert farm_page.wait_for('IP is added successfully.')
    assert farm_page.get_ip(ip, gateway) == (1,1)
    farm_page.delete_ip(farm_name, ip, gateway)
    assert farm_page.wait_for('IP is deleted successfully!')
    assert farm_page.get_ip(ip, gateway) == (0,0)


def test_gateway(browser):
    """
    Test Case: TC1142 - Enter valid Gateway
    Steps:
        - Navigate to the dashboard.
        - Login.
        - From the Twin Details Page Click on Farms
        - Make sure you have at least one farm.
        - Click on the arrow behind any farm id
        - Click on Public IPs
        - Click on add IP button
        - Add IP and Getaway
    Test Data: [Empty Field,All letters, (-,_),54.54,....1270001,127.0.0..1]
    Test Data for Gateway: [ should be numbers separated by '.' ex: 127.0.0.01/16]
    Result: You should see the bottom right alert with the message "Gateway is not formatted correctly".
            No alert displayed and button is enabled.
    """
    farm_page, farm_name = before_test_setup(browser)
    farm_page.create_farm(farm_name)
    assert farm_page.wait_for('Farm created successfully')
    farm_page.search_functionality(farm_name)
    assert farm_page.wait_for_farm_name(farm_name)
    farm_page.search_functionality("")
    farm_page.setup_ip(generate_ip(), farm_name)
    cases = [generate_inavalid_gateway(), '1.0.0.',  '1:1:1:1', '522.255.255.255', '.239.35.78', '1.1.1.1/16', '239.15.35.78.5', ' ', '*.#.@.!|+-']
    for case in cases:
        assert farm_page.add_gateway(case).is_enabled()==False
        assert farm_page.wait_for('Gateway is not valid.')
    farm_page.close_ip()


@pytest.mark.skip(reason="https://github.com/threefoldtech/tfgrid-sdk-ts/issues/3676")
def test_range_ips(browser):
    """
    Test Case: TC1212 - Enter invalid to IP in add range of IPs
    Test Case: TC1211 - Add range of IPs to Farm
    Steps:
        - Navigate to the dashboard.
        - Login.
        - Open the twin
        - From sidebar Click on Farms.
        - Create a farm.
        - Expand farm details.
        - Click on Public IPs
        - Click on add IP button
        - Choose Range
        - Add From IP, To IP and Gateway.
        - Click on the save button.
    Test Data for Gateway: [Empty Field,All letters, (-,_),54.54,....1270001,127.0.0..1]
    Test Data for From IP: [ should be numbers separated by '.' and end with '/' port ex: 127.0.0.01/16]
    Test Data for To IP: [Invalid IP formats, IPs with smaller or bigger values]
    Result: You should see the alert with the correct message responding to invalid input entered and the save button will be disabled.
            You should see the bottom right alert with the message "IP Created!" and the IPs added to your farm.
    """
    farm_page, farm_name = before_test_setup(browser)
    farm_page.create_farm(farm_name)
    assert farm_page.wait_for('Farm created successfully')
    farm_page.search_functionality(farm_name)
    assert farm_page.wait_for_farm_name(farm_name)
    farm_page.search_functionality("")
    farm_page.change_to_range_ip(farm_name)
    cases = [generate_inavalid_ip(), '1.0.0.0/66', '239.255.255/17', '239.15.35.78.5/25', '239.15.35.78.5', ' ', '*.#.@.!|+-']
    for case in cases:
        farm_page.add_range_ips(case, 0, 0).is_enabled()
        assert farm_page.wait_for('Not a valid IP')
        assert browser.find_element(*farm_page.save_button).is_enabled()==False
    farm_page.add_range_ips('255.0.0.1/32', 0, 0).is_enabled()
    assert farm_page.wait_for('IP is not public')
    assert browser.find_element(*farm_page.save_button).is_enabled()==False
    assert farm_page.wait_for_button(farm_page.add_range_ips('1.1.1.254/16', '1.1.1.255/16', '1.1.1.1')).is_enabled()==True
    cases = ['1.0.0.0/66', '239.255.253/17', '239.15.35.78.5/25', '239.15.35.78.5', ' ', '*.#.@.!|+-']
    farm_page.add_range_ips(0, '2', 0)
    assert farm_page.wait_for('Not a valid IP')
    for case in cases:
        farm_page.add_range_ips(0, case, 0).is_enabled()
        assert farm_page.wait_for('Not a valid IP')
        assert browser.find_element(*farm_page.save_button).is_enabled()==False
    assert farm_page.wait_for_button(farm_page.add_range_ips('1.1.1.54/16', '1.1.1.55/16', '1.1.1.1')).is_enabled()==True
    cases = ['1.1.1.74/16', '1.1.1.70/16']
    farm_page.add_range_ips(0, '5', 0)
    assert farm_page.wait_for('Not a valid IP')
    for case in cases:
        farm_page.add_range_ips(0, case, 0).is_enabled()
        assert farm_page.wait_for('Range must not exceed 16.')
        assert browser.find_element(*farm_page.save_button).is_enabled()==False
    assert farm_page.wait_for_button(farm_page.add_range_ips('1.1.1.254/16', '1.1.1.255/16', '1.1.1.1')).is_enabled()==True
    cases = ['1.1.1.--2/16', '1.1.1.sdf/16', '1.1.1.3a/16']
    farm_page.add_range_ips(0, '1', 0)
    assert farm_page.wait_for('Not a valid IP')
    for case in cases:
        farm_page.add_range_ips(0, case, 0).is_enabled()
        assert farm_page.wait_for('Not a valid IP')
        assert browser.find_element(*farm_page.save_button).is_enabled()==False
    assert farm_page.wait_for_button(farm_page.add_range_ips('1.1.1.254/16', '1.1.1.255/16', '1.1.1.1')).is_enabled()==True
    cases = ['1.1.1.17/16', '1.1.1.15/16', '1.1.1.0/16',]
    farm_page.add_range_ips(0, '4', 0)
    assert farm_page.wait_for('Not a valid IP')
    for case in cases:
        farm_page.add_range_ips(0, case, 0).is_enabled()
        assert farm_page.wait_for('To IP must be bigger than From IP.')
        assert browser.find_element(*farm_page.save_button).is_enabled()==False
    assert farm_page.wait_for_button(farm_page.add_range_ips('1.1.1.254/16', '1.1.1.255/16', '1.1.1.1')).is_enabled()==True
    cases = [generate_inavalid_gateway(), '1.0.0.',  '1:1:1:1', '522.255.255.255', '.239.35.78', '1.1.1.1/1', '239.15.35.78.5', ' ', '*.#.@.!|+-']
    farm_page.add_range_ips(0, 0, '3')
    assert farm_page.wait_for('Gateway is not valid.')
    for case in cases:
        farm_page.add_range_ips(0, 0, case).is_enabled()
        assert farm_page.wait_for('Gateway is not valid.')
        assert browser.find_element(*farm_page.save_button).is_enabled()==False
    regenerate = True
    while(regenerate):
        ip1 = generate_ip()
        ip2 = increment_ip(ip1)
        gateway, regenerate = generate_gateway_from_ip(ip1)
    farm_page.wait_for_button(farm_page.add_range_ips(ip1, ip2, gateway)).click()
    assert farm_page.wait_for('IP is added successfully.')
    assert farm_page.get_ip(ip1, 0) == (1,0)
    assert farm_page.get_ip(ip2, 0) == (1,0)
    assert farm_page.get_ip(gateway, 0) == (2,0)


@pytest.mark.skip(reason="https://github.com/threefoldtech/tfgrid-sdk-ts/issues/3676")
def test_farm_details(browser):
    """
    Test Case: TC914 - Farm Details
    Test Case: TC921 - Verify the availability of zero os bootstrap
    Steps:
        - Navigate to the dashboard.
        - Login.
        - From the Twin Details Page Click on Farms
        - Make sure you have at least one farm.
        - Click on the arrow behind any farm id
    Result: You should see Farm id, Farm Name, Linked Twin Id, Certification Type, 
                Linked Pricing policy Id, stellar payout address, Bootstrap Image, Public IPs.
            You should see Zero-OS bootstrap page is opened   
    """
    farm_page, farm_name = before_test_setup(browser)
    grid_proxy = GridProxy(browser)
    assert farm_page.verify_the_availability_of_zero_os_bootstrap() == "https://bootstrap.grid.tf/"
    farm_page.create_farm(farm_name)
    assert farm_page.wait_for('Farm created successfully')
    farm_page.search_functionality(farm_name)
    assert farm_page.wait_for_farm_name(farm_name)
    farm_page.search_functionality("")
    case = "GCD2U5ESLGBA46ZXDVXQWBKHH7SVEW7F55GDO3MVUNHJOBM5DK5QCALQ"
    farm_page.setup_farmpayout_address(farm_name)
    browser.find_element(*farm_page.add_v2_button).click()
    farm_page.wait_for_button(farm_page.add_farmpayout_address(case)).click()
    assert farm_page.wait_for('Address Added successfully!')
    browser.find_element(*farm_page.add_ip_button).click()
    regenerate = True
    while(regenerate):
        ip = generate_ip()
        gateway, regenerate = generate_gateway_from_ip(ip)
    farm_page.add_ip(ip)
    farm_page.wait_for_button(farm_page.add_gateway(gateway)).click()
    assert farm_page.wait_for('IP is added successfully.')
    farm_details = farm_page.farm_detials()
    grid_farm_details = grid_proxy.get_farm_details(farm_details[1])
    assert grid_farm_details[0]['farmId'] == int(farm_details[0])
    assert grid_farm_details[0]['name'] == farm_details[1]
    assert grid_farm_details[0]['twinId'] == int(farm_details[2])
    assert grid_farm_details[0]['certificationType'] == farm_details[3]
    assert grid_farm_details[0]['stellarAddress'][:30] == farm_details[4][:-3]
    assert grid_farm_details[0]['dedicated'] == farm_details[5]
    assert grid_farm_details[0]['pricingPolicyId'] == int(farm_details[6])
    for i in range(len(grid_farm_details[0]['publicIps'])):
        assert grid_farm_details[0]['publicIps'][i]['ip'] == farm_details[7+(i*3)]
        assert grid_farm_details[0]['publicIps'][i]['contractId'] == int(farm_details[8+(i*3)])
        assert grid_farm_details[0]['publicIps'][i]['gateway'] == farm_details[9+(i*3)]