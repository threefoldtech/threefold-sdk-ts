set -e 
while getopts e: flag
do
    case "${flag}" in
        e) endpoint=${OPTARG};;
    esac
done

if [ -n "$endpoint" ]; then 
    echo "Generating meta data from $endpoint";
else
    echo "endpoint url is required, please use -e flag";
    exit 1
fi


outputFile="chainMeta.json"
echo "meta destination file: '$outputFile'"

generateDefs="yarn ts-node --skip-project node_modules/.bin/polkadot-types-from-defs --package @threefold/tfchain_client  --input ./src/interfaces/chain --endpoint ./chainMeta.json"
generateMeta="yarn ts-node --skip-project node_modules/.bin/polkadot-types-from-chain --endpoint ./chainMeta.json --output ./src/interfaces/chain"

err=$(curl -H "Content-Type: application/json" -d '{"id":"1", "jsonrpc":"2.0", "method": "state_getMetadata", "params":[]}' -o $outputFile $endpoint 2>&1)

if [[ $? -ne 0 ]]; then
   echo "Failed to fetch chain metadata due to error: '$err'"
fi

echo "updating node modules.."
yarn

echo "Generating chain types.."
${generateDefs} && ${generateMeta}


echo "Adjusting files..."

if [ -f "./src/interfaces/chain/types.ts" ] && ! grep -q export "./src/interfaces/chain/types.ts"; then
    echo "export {}" >> ./src/interfaces/chain/types.ts
fi

stringToReplace="default: bool | boolean | Uint8Array,"
stringToBeReplaced="_default: bool | boolean | Uint8Array,"
if [ -f "./src/interfaces/chain/augment-api-tx.ts" ]; then
    sed -i "s#$stringToReplace#$stringToBeReplaced#g" src/interfaces/chain/augment-api-tx.ts
fi

echo "Success!"
exit 0