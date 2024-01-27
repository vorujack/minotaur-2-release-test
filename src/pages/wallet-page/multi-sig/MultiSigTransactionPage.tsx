import MultiSigContextHandler from '@/components/sign/context/MultiSigContextHandler';
import { StateWallet } from '@/store/reducer/wallet';
import MultiSigTransaction from './MultiSigTransaction';
import MultiSigDataContextHandler from '@/components/sign/context/MultiSigDataContextHandler';

interface MultiSigTransactionPagePropsType {
  wallet: StateWallet;
}

const MultiSigTransactionPage = (props: MultiSigTransactionPagePropsType) => {
  return (
    <MultiSigContextHandler wallet={props.wallet}>
      <MultiSigDataContextHandler wallet={props.wallet}>
        <MultiSigTransaction wallet={props.wallet} />
      </MultiSigDataContextHandler>
    </MultiSigContextHandler>
  );
};

export default MultiSigTransactionPage;
