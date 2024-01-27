import { Box, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Heading from '@/components/heading/Heading';
import SolitaryTextField from '@/components/solitary/SolitaryTextField';
import { WalletDbAction } from '@/action/db';
import ActionButton from './ActionButton';
import { VisibilityOutlined } from '@mui/icons-material';
import { getRoute, RouteMap } from '@/router/routerMap';
import { StateWallet } from '@/store/reducer/wallet';

interface LocalSettingsPropsType {
  wallet: StateWallet;
}

const LocalSettings = (props: LocalSettingsPropsType) => {
  const navigate = useNavigate();
  const setName = (newName: string) => {
    WalletDbAction.getInstance()
      .setWalletName(props.wallet.id, newName)
      .then(() => null);
  };
  return (
    <Box mb={2}>
      <Heading title="Wallet Settings" />
      <Stack spacing={2}>
        <SolitaryTextField
          label="Wallet name"
          value={props.wallet.name}
          onChange={(newValue) => setName(newValue)}
        />
        {props.wallet.xPub ? (
          <ActionButton
            label="Extended public key"
            helperText="Display extended public key for read-only wallet."
            icon={<VisibilityOutlined />}
            onClick={() =>
              navigate(getRoute(RouteMap.WalletXPub, { id: props.wallet.id }))
            }
          />
        ) : null}
        {/*<SolitarySwitchField*/}
        {/*    label="Privacy mode"*/}
        {/*    value={data.privacyMode}*/}
        {/*    onChange={(checked) =>*/}
        {/*        setData((prevState) => ({ ...prevState, privacyMode: checked }))*/}
        {/*    }*/}
        {/*    helperText="Some description about this option goes here."*/}
        {/*/>*/}

        {/*<ActionButton*/}
        {/*    label="Change sign-tx"*/}
        {/*    helperText="Some description about this option goes here."*/}
        {/*    onClick={() => navigate(RouterMap.ChangePassword)}*/}
        {/*/>*/}
        {/*<ActionButton*/}
        {/*    label="Export wallet"*/}
        {/*    helperText="Some description about this option goes here."*/}
        {/*    icon={<IosShareOutlinedIcon />}*/}
        {/*/>*/}
      </Stack>
    </Box>
  );
};

export default LocalSettings;
