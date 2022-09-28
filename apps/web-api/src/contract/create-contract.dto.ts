import { Contract } from '@entities/Contract';
import { IsEthereumAddress, IsJSON, IsNotEmpty } from 'class-validator';

export class CreateContractDTO implements Partial<Contract> {
  @IsNotEmpty()
  @IsEthereumAddress()
  contract_id: string;

  @IsNotEmpty()
  @IsJSON()
  abi: string;
}
