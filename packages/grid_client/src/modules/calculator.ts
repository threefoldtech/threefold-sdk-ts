import { PricingPolicy, QueryClient } from "@threefold/tfchain_client";

import { TFClient } from "../clients/tf-grid/client";
import { GridClientConfig } from "../config";
import { expose } from "../helpers/expose";
import { validateInput } from "../helpers/validator";
import { CalculatorModel, CUModel, NUModel, SUModel } from "./models";

export interface PricingInfo {
  dedicatedPrice: number;
  dedicatedPackage: {
    package: string;
    discount: number;
  };
  sharedPrice: number;
  sharedPackage: {
    package: string;
    discount: number;
  };
}
export const discountPackages = {
  none: {
    duration: 0,
    discount: 0,
  },
  default: {
    duration: 1.5,
    discount: 20,
  },
  bronze: {
    duration: 3,
    discount: 30,
  },
  silver: {
    duration: 6,
    discount: 40,
  },
  gold: {
    duration: 18,
    discount: 60,
  },
};

class Calculator {
  client: TFClient | QueryClient;

  /**
   * Calculator class for performing various calculations related to pricing and resources.
   *
   * @param {GridClientConfig} config - The configuration object for initializing the client.
   */
  constructor(config: GridClientConfig | QueryClient) {
    this.client = config instanceof QueryClient ? config : config.tfclient;
  }

  /**
   * Calculate the Compute Units (CU) based on the provided CUModel options.
   *
   * @param {CUModel} options - The options containing the number of vCores (cru) and memory (mru) in GB.
   * @returns {number} The calculated Compute Units (CU) based on the provided options.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input parameters before execution.
   */
  @expose
  @validateInput
  calCU(options: CUModel): number {
    const mru_used_1 = options.mru / 4;
    const cru_used_1 = options.cru / 2;
    const cu1 = mru_used_1 > cru_used_1 ? mru_used_1 : cru_used_1;

    const mru_used_2 = options.mru / 8;
    const cru_used_2 = options.cru;
    const cu2 = mru_used_2 > cru_used_2 ? mru_used_2 : cru_used_2;

    const mru_used_3 = options.mru / 2;
    const cru_used_3 = options.cru / 4;
    const cu3 = mru_used_3 > cru_used_3 ? mru_used_3 : cru_used_3;

    let cu = cu1 > cu2 ? cu2 : cu1;
    cu = cu > cu3 ? cu3 : cu;
    return cu;
  }

  /**
   * Calculate the Storage Units (SU) based on the provided SUModel options.
   *
   * @param {SUModel} options - The options containing the allocated storage (hru) in GB and used storage (sru) in GB.
   * @returns {number} The calculated Storage Units (SU) based on the provided options.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input parameters before execution.
   */
  @expose
  @validateInput
  calSU(options: SUModel): number {
    return options.hru / 1200 + options.sru / 200;
  }

  /**
   * Calculate the Network Units (NU) based on the provided NUModel options.
   *
   * @param {NUModel} options - The options containing the number of units (nu) in GB.
   * @returns {number} The calculated Network Units (NU) based on the provided options.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input parameters before execution.
   */
  @expose
  @validateInput
  calNU(options: NUModel): number {
    return (options.nu * 1000) / 1e7;
  }

  /**
   * Asynchronously retrieves the pricing policies from the client.
   *
   * @returns {Promise<PricingPolicy>} A promise that resolves to the pricing policies.
   */
  async getPrices(): Promise<PricingPolicy> {
    const pricing = await this.client.pricingPolicies.get({ id: 1 });
    return pricing;
  }

  /**
   * Calculates the cost of a unique name per month.
   *
   * This function retrieves the price per hour for a unique name, and calculates the total cost in mUSD.
   *
   *
   * @returns {Promise<number>} - The price in mUSD for the unique name usage per month.
   */
  @validateInput
  async namePricing() {
    const uniqueNamePricePerHour = (await this.getPrices()).uniqueName.value;
    const priceInUSD = uniqueNamePricePerHour / 10 ** 7;
    // return cost per month
    return priceInUSD * 24 * 30;
  }

  /**
   * Asynchronously retrieves the TFT price from the TFChain.
   *
   * @returns {Promise<number>} A promise that resolves to the TFT price.
   * @decorators
   * - `@expose`: Exposes the method for external use.
   * - `@validateInput`: Validates the input parameters before execution.
   */
  @expose
  @validateInput
  async tftPrice(): Promise<number> {
    const pricing = await this.client.tftPrice.get();
    return this.client instanceof TFClient ? pricing : pricing / 1000;
  }

  /**
   * Asynchronously calculates the monthly cost in musd (milli USD) based on the provided options.
   *
   * @param {CalculatorModel} options - The calculator model options containing, sru, mru, and some other fields.
   * @returns {Promise<{ musd_month: number, dedicatedDiscount: number }>} A promise that resolves to an object containing the calculated monthly cost in musd and the discount for dedication nodes.
   * @decorators
   * - `@validateInput`: Validates the input parameters before execution.
   */
  @validateInput
  private async pricing(options: CalculatorModel): Promise<{ musd_month: number; dedicatedDiscount: number }> {
    const price = await this.getPrices();
    const cu = this.calCU({ cru: options.cru, mru: options.mru });
    const su = this.calSU({ hru: options.hru, sru: options.sru });
    const nu = this.calNU({ nu: options.nu ? options.nu : 0 });

    const ipv4u = options.ipv4u ? 1 : 0;

    // certified node cotsts 25% more than DIY node
    const certifiedFactor = options.certified ? 1.25 : 1;

    const musd_month =
      (cu * +price?.cu.value + su * +price?.su.value + ipv4u * price?.ipu.value + nu * +price?.nu.value) *
      certifiedFactor *
      24 *
      30;
    return { musd_month: musd_month, dedicatedDiscount: price.discountForDedicationNodes };
  }

  /**
   * Asynchronously calculates the monthly cost and discount packages based on the provided options.
   *
   * @param {CalculatorModel} options - The calculator model options containing various parameters.
   * @returns {Promise<PricingInfo>} A promise that resolves to an object containing the calculated prices and discount packages.
   * @decorators
   * - `@validateInput`: Validates the input parameters before execution.
   */
  @expose
  @validateInput
  async calculate(options: CalculatorModel): Promise<PricingInfo> {
    let balance = 0;
    const pricing = await this.pricing(options);

    // discount for Dedicated Nodes
    const discount = pricing.dedicatedDiscount;
    let dedicatedPrice = pricing.musd_month - pricing.musd_month * (+discount / 100);
    let sharedPrice = pricing.musd_month;
    const TFTPrice = await this.tftPrice();
    if (options.balance) {
      balance = TFTPrice * options.balance * 10000000;
    }

    let dedicatedPackage = "none";
    let sharedPackage = "none";
    for (const pkg in discountPackages) {
      if (balance > dedicatedPrice * discountPackages[pkg].duration) {
        dedicatedPackage = pkg;
      }
      if (balance > sharedPrice * discountPackages[pkg].duration) {
        sharedPackage = pkg;
      }
    }
    dedicatedPrice = (dedicatedPrice - dedicatedPrice * (discountPackages[dedicatedPackage].discount / 100)) / 10000000;
    sharedPrice = (sharedPrice - sharedPrice * (discountPackages[sharedPackage].discount / 100)) / 10000000;
    return {
      dedicatedPrice: dedicatedPrice,
      dedicatedPackage: {
        package: dedicatedPackage,
        discount: discountPackages[dedicatedPackage].discount,
      },
      sharedPrice: sharedPrice,
      sharedPackage: {
        package: sharedPackage,
        discount: discountPackages[sharedPackage].discount,
      },
    };
  }

  /**
   * Asynchronously calculates the monthly cost and discount packages based on the provided options and the user's balance.
   *
   * @param {CalculatorModel} options - The calculator model options containing various parameters.
   * @returns {Promise<PricingInfo>} A promise that resolves to an object containing the calculated prices and discount packages based on the user's balance.
   */
  async calculateWithMyBalance(options: CalculatorModel): Promise<PricingInfo> {
    let balance = options.balance;
    if (this.client instanceof TFClient) {
      const balances = await this.client.balances.getMyBalance();
      balance = balances.free;
    }
    const calculate = await this.calculate({
      cru: options.cru,
      mru: options.mru,
      hru: options.hru,
      sru: options.sru,
      ipv4u: options.ipv4u,
      certified: options.certified,
      balance: balance,
      nu: options.nu,
    });
    return calculate;
  }
}

export { Calculator as calculator };
