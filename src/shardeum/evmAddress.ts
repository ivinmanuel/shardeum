import { AccountType, NetworkAccount, WrappedEVMAccount, InternalAccount } from './shardeumTypes';
import { isWrappedEVMAccount, isInternalAccount } from './wrappedEVMAccountFunctions';

import { ShardeumFlags } from './shardeumFlags';
import * as crypto from '@shardus/crypto-utils';

function formatHexAddress(addressStr: string, length: number): string {
  return addressStr.length === length ? addressStr.slice(2).toLowerCase() : '';
}

export function getAccountShardusAddress(account: WrappedEVMAccount | InternalAccount): string {
  if (isWrappedEVMAccount(account)) {
    const addressSource = account.ethAddress;
    switch (account.accountType) {
      case AccountType.ContractStorage:
        return toShardusAddressWithKey(account.ethAddress, account.key, account.accountType);
      case AccountType.ContractCode:
        return toShardusAddressWithKey(account.contractAddress, account.ethAddress, account.accountType);
      case AccountType.Receipt:
      case AccountType.StakeReceipt:
      case AccountType.UnstakeReceipt:
      case AccountType.InternalTxReceipt:
        return toShardusAddress(addressSource, account.accountType);
      case AccountType.NodeRewardReceipt:
        return account.ethAddress;
      default:
        return toShardusAddress(addressSource, account.accountType);
    }
  } else if (isInternalAccount(account)) {
    switch (account.accountType) {
      case AccountType.NetworkAccount:
      case AccountType.NodeAccount:
      case AccountType.NodeAccount2:
      case AccountType.DevAccount:
        return (account as NetworkAccount).id;
    }
  }
}

export function toShardusAddressWithKey(addressStr: string, secondaryAddressStr: string, accountType: AccountType): string {
  switch (accountType) {
    case AccountType.Account:
      if (addressStr.length !== 42) throw new Error(`Invalid address length for AccountType.Account. addressStr: ${addressStr}`);
      return addressStr.slice(2).toLowerCase() + '0'.repeat(24);
    
    case AccountType.Receipt:
    case AccountType.StakeReceipt:
    case AccountType.UnstakeReceipt:
    case AccountType.InternalTxReceipt:
      return formatHexAddress(addressStr, 66);

    case AccountType.ContractCode:
      return ShardeumFlags.contractCodeKeySilo ? generateShardusAddress(addressStr, secondaryAddressStr, 8) : formatHexAddress(secondaryAddressStr, 66);

    case AccountType.ContractStorage:
      return ShardeumFlags.contractStorageKeySilo ? generateContractStorageAddress(addressStr, secondaryAddressStr) : formatHexAddress(secondaryAddressStr, 66);

    case AccountType.NetworkAccount:
    case AccountType.NodeAccount:
    case AccountType.NodeAccount2:
    case AccountType.NodeRewardReceipt:
    case AccountType.DevAccount:
      return addressStr.toLowerCase();

    default:
      return formatHexAddress(addressStr, 66);
  }
}

function generateShardusAddress(addressStr: string, secondaryAddressStr: string, numPrefixChars: number): string {
  if (addressStr.length !== 42) throw new Error('Invalid address length for ContractCode.');
  secondaryAddressStr = formatHexAddress(secondaryAddressStr, 66);
  const prefix = addressStr.slice(2, numPrefixChars + 2);
  const suffix = secondaryAddressStr.slice(numPrefixChars);
  return (prefix + suffix).toLowerCase();
}

function generateContractStorageAddress(addressStr: string, secondaryAddressStr: string): string {
  if (addressStr.length !== 42) throw new Error('Invalid address length for ContractStorage.');
  const hashedSuffixKey = crypto.hash(secondaryAddressStr + addressStr);
  const prefix = getPrefix(addressStr, hashedSuffixKey);
  const suffix = hashedSuffixKey.slice(prefix.length);
  return (prefix + suffix).toLowerCase();
}

function getPrefix(addressStr: string, hashedSuffixKey: string): string {
  if (ShardeumFlags.contractStoragePrefixBitLength === 3) {
    const combinedNibble = ((parseInt(addressStr[2], 16) & 14) | (parseInt(hashedSuffixKey[0], 16) & 1)).toString(16);
    return combinedNibble + hashedSuffixKey.slice(1);
  }
  const fullHexChars = Math.floor(ShardeumFlags.contractStoragePrefixBitLength / 4);
  const remainingBits = ShardeumFlags.contractStoragePrefixBitLength % 4;
  let prefix = addressStr.slice(2, 2 + fullHexChars);
  if (remainingBits > 0) {
    const prefixLastNibble = parseInt(addressStr[2 + fullHexChars], 16);
    const suffixFirstNibble = parseInt(hashedSuffixKey[fullHexChars], 16);
    const combinedNibble = (prefixLastNibble & (1 << 4) - 1 - (1 << (4 - remainingBits)) | (suffixFirstNibble & ((1 << (4 - remainingBits)) - 1))).toString(16);
    prefix += combinedNibble;
  }
  return prefix;
}

export function toShardusAddress(addressStr: string, accountType: AccountType): string {
  if (ShardeumFlags.VerboseLogs) {
    console.log(`Running toShardusAddress`, typeof addressStr, addressStr, accountType);
  }
  switch (accountType) {
    case AccountType.Account:
    case AccountType.Debug:
      if (addressStr.length !== 42) throw new Error(`Invalid address length for Account or Debug. addressStr: ${addressStr}`);
      return addressStr.slice(2).toLowerCase() + '0'.repeat(24);

    case AccountType.Receipt:
    case AccountType.StakeReceipt:
    case AccountType.UnstakeReceipt:
    case AccountType.InternalTxReceipt:
      return formatHexAddress(addressStr, 66);

    default:
      return formatHexAddress(addressStr, 66) || addressStr.toLowerCase();
  }
}
//more efficent code for improves readability, maintainability, and overall efficiency by leveraging helper functions and switch statements.

// CHANGES MADE
//Helper Functions:

//Created formatHexAddress to handle common hex string slicing and formatting.
//Created generateShardusAddress and generateContractStorageAddress to encapsulate complex address generation logic.
//Switch Statements:

//Used switch statements for better readability and efficiency.
//Error Handling:

//Simplified and standardized error messages.
//Removed Redundancies:

//Consolidated redundant code and functions.
