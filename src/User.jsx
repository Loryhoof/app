import React, { useState, useEffect, useContext } from 'react';
import classnames from 'classnames';

import * as ceramicApi from '../ceramic.js';
import { discordClientId } from '../constants';
import { parseQuery } from '../util.js';
import Modal from './components/modal';
import WebaWallet from './components/wallet';

import blockchainManager from '../blockchain-manager.js';
import { AppContext } from './components/app';

import styles from './User.module.css';

//

export const User = ({ address, setAddress, setLoginFrom }) => {

    const { state, setState } = useContext( AppContext );
    const [ensName, setEnsName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [ loggingIn, setLoggingIn ] = useState(false);
    const [ loginError, setLoginError ] = useState(null);
    const [ autoLoginRequestMade, setAutoLoginRequestMade ] = useState(false);

    //

    const showModal = ( event ) => {

        event.preventDefault();
        // setShow( ! show );

        setState({ openedPanel: 'LoginPanel' });

    };

    const openUserPanel = e => {

        setState({ openedPanel: 'UserPanel' });
    
    };

    const _setAddress = async address => {
        
        if (address) {
            // let live = true;
            // (async () => {
                const ensName = await blockchainManager.getEnsName(address);
                // if (!live) return;
                setEnsName(ensName);

                const avatarUrl = await blockchainManager.getAvatarUrl(ensName);
                // if (!live) return;
                setAvatarUrl(avatarUrl);
            // })();

            /* return () => {
                live = false;
            }; */

            // console.log('render name', {address, ensName, avatarUrl});
        }

        setAddress(address);
    
    };

    const metaMaskLogin = async ( event ) => {

        event.preventDefault();
        event.stopPropagation();

        /* if ( address ) {

            setState({ openedPanel: ( state.openedPanel === 'UserPanel' ? null : 'UserPanel' ) });

        } else { */

            if ( ! loggingIn ) {

                setLoggingIn( true );

                try {

                    const { address, profile } = await ceramicApi.login();
                    await _setAddress(address);
                    setLoginFrom('metamask');
                    // setShow(false);
                    // setLoginFrom('metamask');

                } catch (err) {

                    console.warn(err);

                } finally {

                    setState({ openedPanel: null });

                    setLoggingIn(false);

                }

            }

        // }

    };

    useEffect( () => {

        (async () => {

            const { error, code, id, play, realmId } = parseQuery( window.location.search );

            if ( ! autoLoginRequestMade ) {

                setAutoLoginRequestMade( true );

                if ( code ) {

                    setLoggingIn( true );

                    WebaWallet.waitForLaunch().then( async () => {

                        const { address, error } = await WebaWallet.loginDiscord( code, id );

                        if ( address ) {

                            await _setAddress( address );
                            setLoginFrom( 'discord' );
                            // setShow( false );

                        } else if ( error ) {

                            setLoginError( String( error ).toLocaleUpperCase() );

                        }

                        window.history.pushState( {}, '', window.location.origin );
                        setLoggingIn( false );

                    }); // it may occur that wallet loading is in progress already

                } else {

                    WebaWallet.waitForLaunch().then( async () => {

                        const { address, error } = await WebaWallet.autoLogin();

                        if ( address ) {

                            await  _setAddress( address );
                            setLoginFrom( 'discord' );
                            // setShow( false );

                        } else if ( error ) {

                            setLoginError( String( error ).toLocaleUpperCase() );

                        }

                    }); // it may occur that wallet loading is in progress already

                }

            }

        })();

    }, [ address ] );

    const open = state.openedPanel === 'LoginPanel';
    const loggedIn = !!address;

    //

    return (
        <div
            className={ classnames(
                styles.user,
                open ? styles.open : null,
                loggedIn ? styles.loggedIn : null,
                loggingIn ? styles.loggingIn : null,
            ) }
        >
            <div className={styles.keyWrap} onClick={e => {
                e.preventDefault();
                e.stopPropagation();

                if (!loggedIn) {

                    if ( !open ) {

                        setState({ openedPanel: 'LoginPanel' });

                    } else {
                        setState({ openedPanel: null });
                    }
                }
            }}>
                <div className={styles.key}>
                    <div className={styles.bow}>
                        <img className={styles.icon} src="./images/log-in.svg" />
                    </div>
                    <div className={styles.blade}>
                        <div className={styles.background} />
                        <div className={styles.text}>ログイン Log in</div>
                    </div>
                </div>
            </div>

            <div className={styles.loggingInPlaceholder}>Logging in</div>

            <div
                className={styles.userWrap}
            >
                <div
                    className={styles.userBar}
                    onClick={openUserPanel}
                >
                    {avatarUrl ? (
                        <div
                            className={styles.avatarUrl}
                        >
                            <img className={styles.img} src={avatarUrl} crossOrigin='Anonymous' />
                        </div>
                    ) : null}
                    <div
                        className={styles.address}
                    >{ensName || address || ''} <img className={styles.verifiedIcon} src="./images/verified.svg" /></div>
                </div>
                <div className={styles.logoutBtn}
                    onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        WebaWallet.logout();
                        _setAddress(null);
                    }}
                >Logout</div>
            </div>

            <Modal onClose={ showModal } show={open && !loggingIn}>
                <div className={styles.login_options}>
                
                    <div className={styles.loginDiv}>
                        <div className={styles.loginBtn} onClick={ metaMaskLogin }>
                            <div className={styles.loginBtnText}>
                                <img className={styles.loginBtnImg} src="images/metamask.png" alt="metamask" width="28px"/>
                                <span>MetaMask</span>
                            </div>
                        </div>
                        <a href={`https://discord.com/api/oauth2/authorize?client_id=${discordClientId}&redirect_uri=${window.location.origin}%2Flogin&response_type=code&scope=identify`}>
                            <div className={styles.loginBtn} style={{marginTop: '10px'}}>
                                <div className={styles.loginBtnText}>
                                    <img className={styles.loginBtnImg} src="images/discord-dark.png" alt="discord" width="28px"/>
                                    <span>Discord</span>
                                </div>
                            </div>
                        </a>
                    </div>
                </div>
            </Modal>
        </div>
    );

};
