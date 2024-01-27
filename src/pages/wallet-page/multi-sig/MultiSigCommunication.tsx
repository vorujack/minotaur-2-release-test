import { Button, styled } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  fetchMultiSigBriefRow,
  notAvailableAddresses,
  storeMultiSigRow,
} from '@/action/multi-sig/store';
import ListController from '@/components/list-controller/ListController';
import { MultiSigBriefRow, MultiSigShareData } from '@/types/multi-sig';
import AppFrame from '@/layouts/AppFrame';
import { ContentPasteOutlined } from '@mui/icons-material';
import { GlobalStateType } from '@/store';
import { StateWallet } from '@/store/reducer/wallet';
import MultiSigTransactionItem from './MultiSigTransactionItem';
import { readClipBoard } from '@/utils/clipboard';
import MessageContext from '@/components/app/messageContext';
import * as wasm from 'ergo-lib-wasm-browser';
import { deserialize } from '@/action/box';
import { useNavigate } from 'react-router-dom';
import { RouteMap, getRoute } from '@/router/routerMap';
import { dottedText } from '@/utils/functions';
import BackButtonRouter from '@/components/back-button/BackButtonRouter';

const FloatingButton = styled(Button)(
  ({ theme }) => `
  position: absolute;
  bottom: ${theme.spacing(3)};
  right: ${theme.spacing(3)};
  min-width: 56px;
  width: 56px;
  height: 56px;
  border-radius: 56px;
  box-shadow: ${theme.shadows[2]}!important;
`,
);

interface MultiSigCommunicationPropsType {
  wallet: StateWallet;
}

const MultiSigCommunication = (props: MultiSigCommunicationPropsType) => {
  const [items, setItems] = useState<Array<MultiSigBriefRow>>([]);
  const [loading, setLoading] = useState(false);
  const [reading, setReading] = useState(false);
  const [loadedTime, setLoadedTime] = useState(0);
  const message = useContext(MessageContext);
  const navigate = useNavigate();
  const lastChanged = useSelector(
    (state: GlobalStateType) => state.config.multiSigLoadedTime,
  );
  useEffect(() => {
    if (!loading && loadedTime !== lastChanged) {
      const startUpdating = lastChanged;
      setLoading(true);
      fetchMultiSigBriefRow(props.wallet).then((res) => {
        setItems(res);
        setLoadedTime(startUpdating);
        setLoading(false);
      });
    }
  }, [loading, loadedTime, lastChanged, props.wallet]);

  const handlePasteNewTransaction = async () => {
    setReading(true);
    try {
      const clipBoardContent = await readClipBoard();
      const data = JSON.parse(clipBoardContent) as MultiSigShareData;
      const tx = wasm.ReducedTransaction.sigma_parse_bytes(
        Buffer.from(data.tx, 'base64'),
      );
      const boxes = data.boxes.map(deserialize);
      const invalidAddresses = notAvailableAddresses(
        props.wallet,
        data.commitments,
        tx.unsigned_tx(),
        boxes,
      );
      if (invalidAddresses.length === 0) {
        const row = await storeMultiSigRow(
          props.wallet,
          tx,
          boxes,
          data.commitments,
          [[]],
          data.signed || [],
          data.simulated || [],
          Date.now(),
          data.partial
            ? wasm.Transaction.sigma_parse_bytes(
                Buffer.from(data.partial, 'base64'),
              )
            : undefined,
        );
        if (row) {
          const route = getRoute(RouteMap.WalletMultiSigTxView, {
            id: props.wallet.id,
            txId: row.txId,
          });
          navigate(route);
        }
      } else {
        const messageLines = [
          'Some addresses used in transaction are not derived.',
          'Please derive them and try again',
          'Not derived addresses are:',
          ...invalidAddresses.map((item) => dottedText(item, 10)),
        ];
        message.insert(messageLines.join('\n'), 'error');
      }
    } catch (e: unknown) {
      message.insert(`${(e as { message: unknown }).message}`, 'error');
    }
    setReading(false);
  };
  return (
    <AppFrame title="Multi-sig Communication" navigation={<BackButtonRouter />}>
      <React.Fragment>
        <ListController
          loading={loading}
          error={false}
          errorDescription={''}
          errorTitle={''}
          data={items}
          render={(row) => (
            <MultiSigTransactionItem
              wallet={props.wallet}
              txId={row.txId}
              ergIn={row.ergIn}
              ergOut={row.ergOut}
              signs={row.signed}
              commitments={row.committed}
              tokensIn={row.tokensIn}
              tokensOut={row.tokensOut}
            />
          )}
          divider={false}
          emptyTitle="There is no transaction in progress!"
          emptyDescription="You can add transaction using botton below to start signing process"
          emptyIcon="folder"
        />
        <FloatingButton disabled={reading} onClick={handlePasteNewTransaction}>
          <ContentPasteOutlined />
        </FloatingButton>
      </React.Fragment>
    </AppFrame>
  );
};

export default MultiSigCommunication;
