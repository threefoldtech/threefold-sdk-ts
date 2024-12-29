from random import SystemRandom
import configparser
import ipaddress
import random
import string
import os
import json

def get_seed():
    config = configparser.ConfigParser()
    config.read('Config.ini')
    seed = config['Utils']['seed']
    if (seed == ''):
        try:
            seed = json.loads(os.environ["TFCHAIN_MNEMONICS"])["TFCHAIN_MNEMONICS"]
        except:
            print(
                "You must add account seed either in Config.ini or by exporting TFCHAIN_MNEMONICS.")
    return str(seed)

def get_node_seed():
    config = configparser.ConfigParser()
    config.read('Config.ini')
    seed = config['Utils']['node_seed']
    if (seed == ''):
        try:
            seed = os.environ["TFCHAIN_NODE_MNEMONICS"]
        except:
            print(
                "You must add account seed either in Config.ini or by exporting TFCHAIN_NODE_MNEMONICS.")
    return str(seed)

def get_stellar_address():
    config = configparser.ConfigParser()
    config.read('Config.ini')
    address = config['Utils']['address']
    if (address == ''):
        try:
            address = os.environ["STELLAR_ADDRESS"]
        except:
            print(
                "You must add account stellar address either in Config.ini or by exporting STELLAR_ADDRESS.")
    return str(address)

def get_email():
    config = configparser.ConfigParser()
    config.read('Config.ini')
    email = config['Utils']['email']
    if (email == ''):
        try:
            email = os.environ["EMAIL"]
        except:
            print(
                "You must add account Email either in Config.ini or by exporting EMAIL.")
    return str(email)

def generate_string():
    chars = string.ascii_uppercase + string.digits
    return (''.join(random.choice(chars) for _ in range(10)))

def generate_leters():
    chars = string.digits
    return (''.join(random.choice(chars) for _ in range(10)))

def generate_email():
    random_uppercase_chars = random.choices(string.ascii_uppercase, k=5)
    random_uppercase_chars_string = ''.join(random_uppercase_chars)
    email = generate_string() +'@'+ generate_string() +'.'+ random_uppercase_chars_string
    return email

def generate_ip():
    cryptogen = SystemRandom()
    while True:
        ip = [cryptogen.randrange(256) for _ in range(4)]
        # Check if the generated IP is within private ranges
        if (ip[0] == 10 or
            (ip[0] == 172 and 16 <= ip[1] <= 31) or
            (240 <= ip[0] <= 255) or
            (ip[0] == 192 and ip[1] == 168)):
            continue
        port = cryptogen.randrange(33)
        return f"{'.'.join(map(str, ip))}/{port}"

def generate_gateway():
    first = ['1', '2']
    second = ['', '0', '1', '2', '3', '4', '5']
    gateway = ''.join(random.choice(
        first))+''.join(random.choice(second))+''.join(random.choice(second))+'.'
    gateway += ''.join(random.choice(first)) + \
                       ''.join(random.choice(second)) + \
                               ''.join(random.choice(second))+'.'
    gateway += ''.join(random.choice(first)) + \
                       ''.join(random.choice(second)) + \
                               ''.join(random.choice(second))+'.'
    gateway += ''.join(random.choice(first)) + \
                       ''.join(random.choice(second)) + \
                               ''.join(random.choice(second))
    return gateway

def generate_gateway_from_ip(ipv4):
    cryptogen = SystemRandom()
    ip, mask = ipv4.split('/')
    network = ipaddress.ip_network(f"{ip}/{mask}", strict=False)
    if network.num_addresses <= 2:
        return 0, True
    while True:
        # Generate a random IP within the network range, different from the original IP
        new_ip = network.network_address + cryptogen.randrange(1, network.num_addresses - 1)
        new_ip_address = ipaddress.ip_address(new_ip)
        return str(new_ip_address), False

def increment_ip(ipv4):
    ip, port = ipv4.split('/')
    ip_obj = ipaddress.ip_address(ip)
    incremented_ip_obj = ip_obj + 1
    incremented_ip = str(incremented_ip_obj)
    return f"{incremented_ip}/{port}"

def generate_inavalid_ip():
    first = ['6', '7', '8', '9']
    second = ['6', '7', '8', '9']
    port = random.randrange(0, 15)
    ip = ''.join(random.choice(first))+''.join(random.choice(second)
                 )+''.join(random.choice(second))+'.'
    ip += ''.join(random.choice(first))+''.join(random.choice(second)
                  ) + ''.join(random.choice(second))+'.'
    ip += ''.join(random.choice(first))+''.join(random.choice(second)
                  )+''.join(random.choice(second))+'.'
    ip += ''.join(random.choice(first))+''.join(random.choice(second)
                  )+''.join(random.choice(second))+'/'
    ip += str(port)
    return ip

def generate_inavalid_gateway():
    first = ['6', '7', '8', '9']
    second = ['6', '7', '8', '9']
    gateway = ''.join(random.choice(
        first))+''.join(random.choice(second))+''.join(random.choice(second))+'.'
    gateway += ''.join(random.choice(first)) + \
                       ''.join(random.choice(second)) + \
                               ''.join(random.choice(second))+'.'
    gateway += ''.join(random.choice(first)) + \
                       ''.join(random.choice(second)) + \
                               ''.join(random.choice(second))+'.'
    gateway += ''.join(random.choice(first)) + \
                       ''.join(random.choice(second)) + \
                               ''.join(random.choice(second))
    return gateway

def valid_amount():
    decimal = ((random.randrange(1, 9)))
    rational = (str(random.uniform(0.001, 0.1)))
    sum = rational[0:5]
    list = [decimal, float(sum)]
    return (random.choice(list))

def invalid_amount():
    rational = (str(random.uniform(100, 10000)))
    return rational

def invalid_amount_negtive():
    negative = (str(random.randrange(1, 99)))
    negative = '-'+negative
    return negative

def invalid_address():
    chars = string.ascii_uppercase + string.digits
    begin = '5'
    return (begin+''.join(random.choice(chars) for _ in range(47)))

def randomize_public_ipv4():
    ips = ['1.0.0.0', '9.255.255.255', '11.0.0.0', '126.255.255.255', '129.0.0.0', '169.253.255.255',
           '169.255.0.0', '172.15.255.255', '172.32.0.0', '191.0.1.255', '192.0.3.0', '192.88.98.255',
           '192.88.100.0', '192.167.255.255', '192.169.0.0', '198.17.255.255', '198.20.0.0']
    ip = random.choice(ips)
    ip_subnet = ip + '/' + random.choice(['26', '27', '28', '29'])
    return ip_subnet, ip


def convert_to_scaled_float(number):
    str_number = str(number)
    if '.' in str_number:
        decimal_index = str_number.index('.')
    else:
        decimal_index = len(str_number)
    divisor = 10 ** decimal_index
    scaled_number = number / divisor
    return scaled_number


def byte_converter(value):
    # Define the unit and the numeric value before checking conditions
    unit = value[-2].upper()  # Last character represents the unit (P, T, G)
    number_str = value[:-3].strip()  # Everything except the last two characters is the number

    if value != '0':
        # Convert based on the unit
        if unit == 'P':  # Petabytes
            return float(number_str) * (1024 ** 5)
        elif unit == 'T':  # Terabytes
            return float(number_str) * (1024 ** 4)
        elif unit == 'G':  # Gigabytes
            return float(number_str) * (1024 ** 3)

    return float(value)


def get_min(nodes, resource):
    min = nodes[0][resource]
    for node in nodes:
        if min > node[resource]:
            min = node[resource]
    return min

def get_max(nodes, resource):
    max = nodes[0][resource]
    for node in nodes:
        if max < node[resource]:
            max = node[resource]
    return max

def filter_result(nodes, data, resource):
    result = 0
    for node in nodes:
        if node[resource] >= data :
            result += 1
    return result
