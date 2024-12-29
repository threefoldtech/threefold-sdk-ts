import configparser

class Base:
    config = configparser.ConfigParser()
    config.read('Config.ini')
    port = config['Base']['port']
    net = config['Base']['net']
    base_url = 'http://localhost:' + str(port) + '/'
    if str(net) == 'main':
        gridproxy_url = 'https://gridproxy.grid.tf/'
    else:
        gridproxy_url = 'https://gridproxy.' + str(net) + '.grid.tf/'