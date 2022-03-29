package server_test

import (
	"fmt"
	"os"
	"strings"
	"sync"
	"syscall"
	"testing"
	"time"

	"github.com/dcrosby42/notingham/server"
	"github.com/go-resty/resty/v2"
	. "github.com/pepinns/go-hamcrest"
	"github.com/phayes/freeport"
)

func Test_Ping(t *testing.T) {
	WithNotingham(t, func(fix *NotinghamFixture) {
		client := resty.New()

		url := fix.Url("/ping")
		got := make(map[string]string)
		resp, err := client.R().
			SetHeader("Accept", "application/json").
			SetResult(&got).
			Get(url)
		Assert(t).That(err, IsNil())
		Assert(t).That(resp.StatusCode(), Equals(200))
		Assert(t).That(got["message"], Equals("pong"))
	})
}

type NotinghamFixture struct {
	Config server.Config
	Client *resty.Client
	wg     sync.WaitGroup
	done   chan os.Signal
}

func WithNotingham(t *testing.T, fn func(*NotinghamFixture)) {
	fix := NotinghamFixture{}
	fix.Start(t)
	defer fix.Stop(t)
	fn(&fix)
}

func (me *NotinghamFixture) Start(t *testing.T) {
	me.done = make(chan os.Signal, 1)
	me.Client = resty.New()
	if me.Config.BindHost == "" {
		me.Config.BindHost = "127.0.0.1"
	}
	if me.Config.BindPort == 0 {
		var err error
		me.Config.BindPort, err = freeport.GetFreePort()
		Assert(t).That(err, IsNil())
	}
	go func() {
		me.wg.Add(1)
		err := server.Serve(me.Config, me.done)
		Assert(t).That(err, IsNil())
		me.wg.Done()
	}()
dance:
	// ping loop  to await server readiness
	for d := time.Now().Add(5 * time.Second); time.Now().Before(d); {
		resp, err := me.Client.R().Get(me.Url("/ping"))
		if err == nil && resp.StatusCode() == 200 {
			break dance
		}
		time.Sleep(200 * time.Millisecond)
	}
}

func (me *NotinghamFixture) Stop(*testing.T) {
	me.done <- syscall.SIGINT
	me.wg.Wait()
}

func (me *NotinghamFixture) Url(path string) string {
	base := fmt.Sprintf("http://%s:%v", me.Config.BindHost, me.Config.BindPort)
	if len(path) > 0 {
		if !strings.HasPrefix(path, "/") {
			base += "/"
		}
		base += path
	}
	return base
}
