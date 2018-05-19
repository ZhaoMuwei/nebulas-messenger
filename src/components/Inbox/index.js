import React from 'react'
import PropTypes from 'prop-types'
import Controls from '../Controls'
import List from '../List'
import NewMessage from '../NewMessage'
import request from '../../utils/request'
import './styles.css'

export default class Inbox extends React.Component {
    static propTypes = {
        address: PropTypes.string.isRequired,
    }

    constructor(props) {
        super(props)
        this.state = {
            address: props.address,
            loading: true,
            messages: [],
            isModalVisible: false,
        }
    }

    componentDidMount() {
        this.hasMounted = true
        this.loadMessages()
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.address !== this.state.address) {
            this.setState({address: nextProps.address}, () => {
                this.loadMessages()
            })
        }
    }

    componentWillUnmount() {
        this.hasMounted = false
    }

    loadMessages = async () => {
        this.setState({loading: true})

        const method = 'neb_call'
        const data = await request({
            data: {
                to : window.DApp,
                value : '0',
                contract : {
                    function : 'list',
                    args: `["${this.state.address}"]`,
                },
            },
            method,
        })

        if (!data || data.execute_err) {
            console.error(data.execute_err)
            return
        }

        try {
            const result = JSON.parse(data.result)
            if (this.hasMounted) {
                this.setState({messages: result, loading: false});
            }
        }
        catch(error) {
            throw error
        }
    }

    handleCreateButtonClick = () => {
        this.setState({isModalVisible: true})
    }

    handleReloadButtonClick = () => {
        this.loadMessages()
    }

    handleNewMessageOK = async ({address, subject, content}) => {
        const method = 'neb_sendTransaction'
        const response = await request({
            data: {
                to : window.DApp,
                value : '0',
                contract : {
                    function : 'send',
                    args: `["${this.state.address}", "${address}", "${subject}", "${content}"]`,
                },
            },
            method,
        })

        if (!response || !response.txhash) {
            return
        }

        // Finally, msg sent successfully.
        this.setState({isModalVisible: false}, () => {
            // this.loadMessages()
        })
    }

    handleNewMessageCancel = () => {
        this.setState({isModalVisible: false})
    }

    render() {
        const {
            messages,
            loading,
            isModalVisible,
        } = this.state

        return (
            <section className="Inbox">
                <Controls
                    disabled={loading}
                    loading={loading}
                    onCreateButtonClick={this.handleCreateButtonClick}
                    onReloadButtonClick={this.handleReloadButtonClick}
                />
                <div className="Inbox__ListWrapper">
                    <List
                        loading={loading}
                        data={messages}
                    />
                </div>

                <NewMessage
                    visible={isModalVisible}
                    onOK={this.handleNewMessageOK}
                    onCancel={this.handleNewMessageCancel}
                />
            </section>
        )
    }
}
