import { useState } from 'react'
import { ethers } from "ethers"
import { Row, Form, Button } from 'react-bootstrap'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import {Buffer} from 'buffer';
import { useNavigate, useLocation } from "react-router-dom";

const projectId = process.env.REACT_APP_PROJECT_ID;
const projectSecretKey = process.env.REACT_APP_PROJECT_KEY;
const authorization = "Basic " + Buffer.from(projectId + ":" + projectSecretKey).toString('base64');
const client = ipfsHttpClient({
  url: "https://ipfs.infura.io:5001/api/v0",
  headers: {
    authorization,
  },
})

const Create = ({ marketplace, nft }) => {
  const {state} = useLocation();
  const navigate = useNavigate();
  const [image, setImage] = useState(state ? state.image : '')
  const [price, setPrice] = useState(state ? ethers.utils.formatEther(state.price) : 0)
  const [name, setName] = useState(state ? state.name : '')
  const [description, setDescription] = useState(state ? state.description : '')
  const uploadToIPFS = async (event) => {
    event.preventDefault()
    const file = event.target.files[0]
    if (typeof file !== 'undefined') {
      try {
        const result = await client.add(file)
        console.log(result)
        setImage(`https://ipfs.io/ipfs/${result.path}`)
      } catch (error){
        console.log("ipfs image upload error: ", error)
      }
    }
  }
  const createNFT = async () => {
    if (!image || !price || !name || !description || price<=0) return
    try{
      const result = await client.add(JSON.stringify({image, price, name, description}))
      mintThenList(result)
    } catch(error) {
      console.log("ipfs uri upload error: ", error)
    }
    redirectHome();
  }
  const mintThenList = async (result) => {
    const uri = `https://ipfs.io/ipfs/${result.path}`
    // mint nft 
    await(await nft.mintNft(uri)).wait()
    // get tokenId of new nft 
    const id = await nft.getTokenCounter()
    // approve marketplace to spend nft
    await(await nft.setApprovalForAll(marketplace.address, true)).wait()
    // add nft to marketplace
    const listingPrice = ethers.utils.parseEther(price.toString())
    await(await marketplace.listItem(nft.address, id, listingPrice)).wait()
  }
  const reListNFT = async () => {
    if (!image || !price || !name || !description || price<=0) return
    try {
      const id = state.itemId;
      // approve marketplace to spend nft
      await(await nft.setApprovalForAll(marketplace.address, true)).wait()
      // add nft to marketplace
      const listingPrice = ethers.utils.parseEther(price.toString())
      await(await marketplace.listItem(nft.address, id, listingPrice)).wait()
    } catch (error) {
      console.log("relisting error: ", error)
    }
    redirectHome();
  }
  const redirectHome = () => {
    navigate('/');
  }
  return (
    <>
      <h1 style={{color: 'Gray', textDecoration: 'underline'}}>Create</h1>
      <div className="container-fluid mt-5">
        <div className="row">
          <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
            <div className="content mx-auto">
              <Row className="g-4">
                <Form.Control
                  type="file"
                  required
                  name="file"
                  onChange={uploadToIPFS}
                />
                <Form.Control onChange={(e) => setName(e.target.value)} value={name} size="lg" required type="text" placeholder="Name" />
                <Form.Control onChange={(e) => setDescription(e.target.value)} value={description} size="lg" required as="textarea" placeholder="Description" />
                <Form.Control onChange={(e) => setPrice(e.target.value)} value={price} size="lg" required type="number" placeholder="Price in ETH" />
                <div className="d-grid px-0">
                  {
                    state ?
                    (<Button onClick={reListNFT} variant="primary" size="lg">
                      List NFT!
                    </Button>)
                    :
                    (<Button onClick={createNFT} variant="primary" size="lg">
                      Create & List NFT!
                    </Button>)
                  }
                </div>
              </Row>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

export default Create