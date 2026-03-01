import { useState, useCallback } from "react";
import { Button } from "../ui";
import { alertAndLog } from "../../utils/alertAndLog";
import { useMobileWallet } from "../../utils/useMobileWallet";

export function ConnectButton() {
  const { connect } = useMobileWallet();
  const [authorizationInProgress, setAuthorizationInProgress] = useState(false);
  const handleConnectPress = useCallback(async () => {
    try {
      if (authorizationInProgress) {
        return;
      }
      setAuthorizationInProgress(true);
      await connect();
    } catch (err: any) {
      alertAndLog(
        "Error during connect",
        err instanceof Error ? err.message : err
      );
    } finally {
      setAuthorizationInProgress(false);
    }
  }, [authorizationInProgress, connect]);
  return (
    <Button
      disabled={authorizationInProgress}
      onPress={handleConnectPress}
      style={{ flex: 1 }}
    >
      Connect
    </Button>
  );
}

export function SignInButton() {
  const { signIn } = useMobileWallet();
  const [signInInProgress, setSignInInProgress] = useState(false);
  const handleSignInPress = useCallback(async () => {
    try {
      if (signInInProgress) {
        return;
      }
      setSignInInProgress(true);
      await signIn({
        domain: "kawula.app",
        statement: "Sign into Kawula",
        uri: "https://kawula.app",
      });
    } catch (err: any) {
      alertAndLog(
        "Error during sign in",
        err instanceof Error ? err.message : err
      );
    } finally {
      setSignInInProgress(false);
    }
  }, [signInInProgress, signIn]);
  return (
    <Button
      variant="outline"
      disabled={signInInProgress}
      onPress={handleSignInPress}
      style={{ marginLeft: 4, flex: 1 }}
    >
      Sign in
    </Button>
  );
}
