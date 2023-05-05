import { useState, useEffect } from 'react'
import { ethers } from "ethers"
import { Row, Col, Card, Button } from 'react-bootstrap'
import { useNavigate } from "react-router-dom";

export default function Profile({ marketplace, nft, account }) {
  const [loading, setLoading] = useState(true)
  const [listedItems, setListedItems] = useState([])
  const [unlistedItems, setUnlistedItems] = useState([])
  const [accountEth, setAccountEth] = useState(0)
  const navigate = useNavigate();
  const loadListedItems = async () => {
    const eth = await marketplace.getProceeds(account);
    setAccountEth(eth);
    // Load all unlisted items that the user listed
    const itemCount = await nft.getTokenCounter()
    let listedItems = []
    let unlistedItems = []
    for (let indx = 1; indx <= itemCount; indx++) {
      const i = await marketplace.getListing(nft.address, indx)
      if (i.seller.toLowerCase() === account) {
        // get uri url from nft contract
        const uri = await nft.tokenURI(indx)
        // use uri to fetch the nft metadata stored on ipfs 
        const response = await fetch(uri)
        const metadata = await response.json()
        // get total price of item (item price + fee)
        const totalPrice = i.price
        // define listed item object
        let item = {
          totalPrice,
          price: i.price,
          itemId: indx,
          name: metadata.name,
          description: metadata.description,
          image: metadata.image
        }
        if (item.price > 0) listedItems.push(item)
        // Add listed item to unlisted items array if unlisted
        if (item.price <= 0) unlistedItems.push(item)
      }
    }
    setLoading(false)
    setListedItems(listedItems)
    setUnlistedItems(unlistedItems)
  }

  useEffect(() => {
    loadListedItems()
  }, [])

  var renderListedItems = (items) => {
    return (
      <>
        <h2>Listed</h2>
        <Row xs={1} md={2} lg={4} className="g-4 py-3">
          {items.map((item, idx) => (
            <Col key={idx} className="overflow-hidden">
              <Card>
                <Card.Img variant="top" src={item.image} />
                <Card.Body color="secondary">
                  <Card.Title>{item.name}</Card.Title>
                  <Card.Text>
                    {item.description}
                  </Card.Text>
                </Card.Body>
                <Card.Footer>{ethers.utils.formatEther(item.totalPrice)} ETH</Card.Footer>
                {/* &nbsp; */}
                <Button onClick={() => delistItem(item)} variant="outline-secondary">Delist</Button>
              </Card>
            </Col>
          ))}
        </Row>
      </>
    )
  }

  var renderUnlistedItems = (items) => {
    return (
      <>
        <h2>Unlisted</h2>
        <Row xs={1} md={2} lg={4} className="g-4 py-3">
          {items.map((item, idx) => (
            <Col key={idx} className="overflow-hidden">
              <Card>
                <Card.Img variant="top" src={item.image} />
                <Card.Body color="secondary">
                  <Card.Title>{item.name}</Card.Title>
                  <Card.Text>
                    {item.description}
                  </Card.Text>
                </Card.Body>
                <Card.Footer>
                  <Button onClick={() => redirectCreate(item)} variant="outline-secondary">Sell</Button>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      </>
    )
  }
  const withdrawEth = async () => {
    await (await marketplace.withdrawProceeds()).wait()
    setAccountEth(0);
  }
  const delistItem = async (item) => {
    await (await marketplace.cancelListing(nft.address, item.itemId)).wait()
    redirectHome();
  }
  var redirectHome = () => {
    navigate('/');
  }
  var redirectCreate = (item) => {
    navigate('/create', { state: item});
  }

  if (loading) return (
    <main style={{ padding: "1rem 0" }}>
      <h2>Loading...</h2>
    </main>
  )
  return (
    <>
      <h1 style={{color: 'Gray', textDecoration: 'underline'}}>Profile</h1>
      <br/>
      <div className="flex justify-center">
        <h3>
          {
            accountEth > 0 ?
            <div>
              {`Withdraw ETH from your account: ${accountEth} ETH`}
              &nbsp;
              <Button onClick={() => withdrawEth()} variant="outline-secondary">Withdraw</Button>
            </div>
            :
            `You have 0 ETH in your account.`
          }
        </h3>
        <hr/>
        {listedItems.length > 0 || unlistedItems.length > 0 ?
          <div className="px-5 py-3 container">
            {unlistedItems.length > 0 && renderUnlistedItems(unlistedItems)}
            {listedItems.length > 0 && renderListedItems(listedItems)}
          </div>
          : (
            <main style={{ padding: "1rem 0" }}>
              <h2>No listed assets</h2>
            </main>
          )}
      </div>
    </>
  );
}